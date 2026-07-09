import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/app/App";

afterEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

function renderSignedInApp(username = "camp-user") {
  const renderResult = render(<App />);

  fireEvent.change(screen.getByLabelText("使用者名稱"), {
    target: { value: username },
  });
  fireEvent.change(screen.getByLabelText("密碼"), {
    target: { value: "demo-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "建立帳號並登入" }));

  return renderResult;
}

describe("App", () => {
  it("requires registration or login before entering the workbench", () => {
    render(<App />);

    expect(screen.getByText("災害資訊處理入口")).toBeInTheDocument();
    expect(screen.getByText("註冊帳號")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "查詢頁面" }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("使用者名稱"), {
      target: { value: "camp-user" },
    });
    fireEvent.change(screen.getByLabelText("密碼"), {
      target: { value: "demo-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "建立帳號並登入" }));

    expect(
      screen.getByRole("button", { name: "查詢頁面" }),
    ).toBeInTheDocument();
    expect(screen.getByText("目前使用者：camp-user")).toBeInTheDocument();
  });

  it("lets an existing session log in with a registered username", () => {
    window.sessionStorage.setItem(
      "phase0-registered-users",
      JSON.stringify(["existing-user"]),
    );

    render(<App />);

    expect(screen.getByText("登入帳號")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("使用者名稱"), {
      target: { value: "missing-user" },
    });
    fireEvent.change(screen.getByLabelText("密碼"), {
      target: { value: "demo-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登入工作台" }));

    expect(
      screen.getByText("找不到這個使用者名稱，請先註冊"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("使用者名稱"), {
      target: { value: "existing-user" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登入工作台" }));

    expect(screen.getByText("目前使用者：existing-user")).toBeInTheDocument();
  });

  it("keeps the home page focused on the staff workbench", () => {
    renderSignedInApp();

    expect(
      screen.queryByRole("button", { name: "原始資訊" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "整理工作台" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("查詢頁面")).toBeInTheDocument();
    expect(screen.getByText("工作人員頁面")).toBeInTheDocument();
    expect(screen.getByText("災民上傳頁面")).toBeInTheDocument();
    expect(screen.getByText("登錄者頁面")).toBeInTheDocument();
    expect(screen.getByText("未通過頁面")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "需求" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "時間" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "地點" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "招募" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    renderSignedInApp();

    fireEvent.click(screen.getByRole("button", { name: "工作人員頁面" }));

    expect(
      screen.getByText("這裡提供工作人員修改、整理與補充判斷的空間。"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("adds classification search to the staff workbench queue", () => {
    renderSignedInApp();

    fireEvent.click(screen.getByRole("button", { name: "工作人員頁面" }));

    const queue = screen.getByLabelText("選擇資料");
    expect(
      within(queue).getByLabelText("工作人員分類搜尋"),
    ).toBeInTheDocument();
    expect(within(queue).getByText("12 / 12 筆符合")).toBeInTheDocument();

    fireEvent.change(within(queue).getByLabelText("工作人員分類搜尋"), {
      target: { value: "phone_call" },
    });

    expect(within(queue).getByText("M-012")).toBeInTheDocument();
    expect(within(queue).queryByText("M-001")).not.toBeInTheDocument();

    const staffFilter = within(queue).getByLabelText("工作人員分類篩選");
    fireEvent.click(
      within(staffFilter).getByRole("button", { name: "災民上傳" }),
    );

    expect(within(queue).getByText("0 / 12 筆符合")).toBeInTheDocument();
    expect(within(queue).getByText("沒有符合條件的資料")).toBeInTheDocument();
  });

  it("adds a classification search panel for phase 0 records", () => {
    renderSignedInApp();

    expect(screen.getByText("分類查詢")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("搜尋關鍵字、地點或需求"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "需求" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "時間" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "地點" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "招募" })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("搜尋關鍵字、地點或需求"), {
      target: { value: "雨鞋" },
    });

    expect(screen.getAllByText(/雨鞋/i).length).toBeGreaterThan(0);
  });

  it("lets a signed-in query user accept and cancel a task", () => {
    renderSignedInApp();

    const acceptancePanel = screen.getByLabelText("M-001 接受任務");

    expect(
      within(acceptancePanel).getByText("目前 0 人接受"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(acceptancePanel).getByRole("button", { name: "接受任務" }),
    );

    expect(
      within(acceptancePanel).getByText("目前 1 人接受"),
    ).toBeInTheDocument();
    expect(
      within(acceptancePanel).getByText("接受者：camp-user"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(acceptancePanel).getByRole("button", { name: "取消接受" }),
    );

    expect(
      within(acceptancePanel).getByText("目前 0 人接受"),
    ).toBeInTheDocument();
    expect(
      within(acceptancePanel).getByText("接受者：尚無"),
    ).toBeInTheDocument();
  });

  it("shows accepted tasks on the reporter page and to other signed-in users", () => {
    const { unmount } = renderSignedInApp();

    const acceptancePanel = screen.getByLabelText("M-001 接受任務");
    fireEvent.click(
      within(acceptancePanel).getByRole("button", { name: "接受任務" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "登錄者頁面" }));

    const acceptedTasks = screen.getByLabelText("我接受的任務");
    expect(within(acceptedTasks).getByText("M-001")).toBeInTheDocument();
    expect(
      within(acceptedTasks).getByText("接受者：camp-user"),
    ).toBeInTheDocument();

    unmount();
    window.sessionStorage.clear();

    render(<App />);
    fireEvent.change(screen.getByLabelText("使用者名稱"), {
      target: { value: "other-user" },
    });
    fireEvent.change(screen.getByLabelText("密碼"), {
      target: { value: "demo-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "建立帳號並登入" }));
    fireEvent.click(screen.getByRole("button", { name: "查詢頁面" }));

    const otherUserAcceptancePanel = screen.getByLabelText("M-001 接受任務");
    expect(
      within(otherUserAcceptancePanel).getByText("目前 1 人接受"),
    ).toBeInTheDocument();
    expect(
      within(otherUserAcceptancePanel).getByText("接受者：camp-user"),
    ).toBeInTheDocument();
  });

  it("allows selecting multiple category buttons at once", () => {
    renderSignedInApp();

    fireEvent.click(screen.getByRole("button", { name: "需求" }));
    fireEvent.click(screen.getByRole("button", { name: "地點" }));

    expect(screen.getByRole("button", { name: "需求" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "地點" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("supports multi-select time buttons for morning noon and evening", () => {
    renderSignedInApp();

    fireEvent.click(screen.getByRole("button", { name: "早上" }));
    fireEvent.click(screen.getByRole("button", { name: "晚上" }));

    expect(screen.getByRole("button", { name: "早上" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "晚上" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("hides staff-reviewed records with task blocker tags from the query page", () => {
    renderSignedInApp();

    fireEvent.click(screen.getByRole("button", { name: "工作人員頁面" }));
    fireEvent.click(screen.getByRole("button", { name: "標為已人工審核" }));
    fireEvent.click(
      screen.getByRole("button", { name: "需求分類：須自備工具" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "需求分類：不須自備工具" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "需求分類：需要物資" }));
    fireEvent.click(screen.getByRole("button", { name: "地點不清楚" }));
    fireEvent.click(screen.getByRole("button", { name: "來源未確認" }));
    fireEvent.click(screen.getByRole("button", { name: "查詢頁面" }));

    expect(screen.queryByText("已人工審核")).not.toBeInTheDocument();
    expect(screen.queryByText("M-001")).not.toBeInTheDocument();
    expect(
      screen.getByText("已隱藏 1 筆不能直接變成任務的資料。"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("搜尋關鍵字、地點或需求"), {
      target: { value: "來源未確認" },
    });

    expect(screen.queryByText("M-001")).not.toBeInTheDocument();
  });

  it("lets a reporter create a front-end only upload draft", () => {
    renderSignedInApp();

    fireEvent.click(screen.getByRole("button", { name: "災民上傳頁面" }));

    expect(screen.getByText("目前使用者：camp-user")).toBeInTheDocument();
    expect(
      screen.getByText("送出一筆待人工確認的原始資訊"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("尚未查核").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("回報者身分"), {
      target: { value: "家屬代填" },
    });
    fireEvent.change(screen.getByLabelText("需要協助內容"), {
      target: { value: "需要飲用水與協助搬動物品" },
    });
    expect(screen.getByRole("button", { name: "不確定" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "活動中心" }));
    expect(screen.getByRole("button", { name: "活動中心" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: "活動中心附近" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("備註"), {
      target: { value: "上傳者還不確定精確位置" },
    });
    fireEvent.click(screen.getByRole("button", { name: "地點" }));
    fireEvent.click(screen.getByRole("button", { name: "招募" }));
    fireEvent.click(screen.getByRole("button", { name: "需要物資" }));
    fireEvent.click(screen.getByRole("button", { name: "送出上傳" }));

    expect(
      screen.getByText("這裡提供工作人員修改、整理與補充判斷的空間。"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("U-001").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("需要飲用水與協助搬動物品").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("災民上傳資料")).toBeInTheDocument();
    expect(
      screen.getByText("收到 1 筆上傳資料，審核通過後才會出現在查詢頁。"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("上傳者還不確定精確位置").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("camp-user")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "查詢頁面" }));

    expect(screen.getByText("分類查詢")).toBeInTheDocument();
    expect(screen.queryByText("U-001")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "工作人員頁面" }));
    fireEvent.click(screen.getByRole("button", { name: "標為審核通過" }));

    expect(screen.getAllByText("審核通過").length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("button", { name: "已審核通過" })
        .some((button) => button.hasAttribute("disabled")),
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "查詢頁面" }));

    expect(screen.getAllByText("U-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("回報者：camp-user").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("需要飲用水與協助搬動物品").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("災民上傳").length).toBeGreaterThan(0);
    expect(screen.getAllByText("需要物資").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText("搜尋關鍵字、地點或需求"), {
      target: { value: "需要物資" },
    });

    expect(screen.getAllByText("U-001").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "工作人員頁面" }));
    fireEvent.click(screen.getByRole("button", { name: "刪除這筆上傳草稿" }));

    expect(screen.queryByText("U-001")).not.toBeInTheDocument();
    expect(screen.getByText("目前沒有送出的上傳資料。")).toBeInTheDocument();
  });

  it("lets a signed-in reporter edit resubmit complete and delete their own upload", () => {
    renderSignedInApp();

    fireEvent.click(screen.getByRole("button", { name: "災民上傳頁面" }));
    fireEvent.change(screen.getByLabelText("需要協助內容"), {
      target: { value: "原本的上傳內容" },
    });
    fireEvent.click(screen.getByRole("button", { name: "送出上傳" }));

    fireEvent.click(screen.getByRole("button", { name: "登錄者頁面" }));

    const reporterPanel = screen.getByLabelText("登錄者資料管理");
    expect(within(reporterPanel).getByText("U-001")).toBeInTheDocument();
    expect(
      within(reporterPanel).getByText("原本的上傳內容"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(reporterPanel).getByRole("button", { name: "編輯" }),
    );
    fireEvent.change(within(reporterPanel).getByLabelText("需要協助內容"), {
      target: { value: "重新送審後的內容" },
    });
    fireEvent.click(
      within(reporterPanel).getByRole("button", { name: "活動中心" }),
    );
    fireEvent.click(
      within(reporterPanel).getByRole("button", { name: "重新送審" }),
    );

    expect(
      screen.getByText("這裡提供工作人員修改、整理與補充判斷的空間。"),
    ).toBeInTheDocument();
    expect(screen.getByText("重新送審後的內容")).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "標為審核通過" }));
    fireEvent.click(screen.getByRole("button", { name: "查詢頁面" }));

    expect(screen.getByText("重新送審後的內容")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "登錄者頁面" }));
    fireEvent.click(screen.getByRole("button", { name: "標示已完成" }));

    expect(screen.getAllByText("已完成").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "查詢頁面" }));

    expect(screen.queryByText("重新送審後的內容")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "登錄者頁面" }));
    fireEvent.click(screen.getByRole("button", { name: "刪除" }));

    expect(screen.queryByText("U-001")).not.toBeInTheDocument();
    expect(screen.getByText("目前沒有你上傳的資料")).toBeInTheDocument();
  });

  it("hides approved upload drafts with task blocker tags from the query page", () => {
    window.sessionStorage.setItem(
      "phase0-upload-review-drafts",
      JSON.stringify([
        {
          id: "U-888",
          reporterName: "saved-user",
          role: "本人",
          needSummary: "已通過但仍不能直接變成任務",
          locationClue: "不確定",
          note: "仍需要補充位置",
          categoryTags: ["需求"],
          humanReviewed: true,
          reviewDecision: "approved",
          demandTags: ["需要物資"],
          taskBlockerTags: ["地點不清楚"],
        },
      ]),
    );

    renderSignedInApp("reviewer");

    expect(screen.queryByText("U-888")).not.toBeInTheDocument();
    expect(
      screen.queryByText("已通過但仍不能直接變成任務"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("已隱藏 1 筆不能直接變成任務的資料。"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "工作人員頁面" }));

    expect(screen.getAllByText("U-888").length).toBeGreaterThan(0);
    expect(screen.getByText("已通過但仍不能直接變成任務")).toBeInTheDocument();
  });

  it("keeps rejected upload drafts out of query and records them on the rejected page", () => {
    renderSignedInApp();

    fireEvent.click(screen.getByRole("button", { name: "災民上傳頁面" }));
    fireEvent.change(screen.getByLabelText("需要協助內容"), {
      target: { value: "這筆資料需要退回補充" },
    });
    fireEvent.click(screen.getByRole("button", { name: "送出上傳" }));

    fireEvent.click(screen.getByRole("button", { name: "來源未確認" }));
    fireEvent.click(screen.getByRole("button", { name: "標為未通過" }));

    expect(
      screen.getByRole("heading", { name: "未通過頁面" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("U-001").length).toBeGreaterThan(0);
    expect(screen.getByText("這筆資料需要退回補充")).toBeInTheDocument();
    expect(screen.getAllByText("未通過").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "查詢頁面" }));

    expect(screen.queryByText("U-001")).not.toBeInTheDocument();
    expect(screen.queryByText("這筆資料需要退回補充")).not.toBeInTheDocument();
  });

  it("keeps upload review drafts after a page refresh in this session", () => {
    window.sessionStorage.setItem(
      "phase0-upload-review-drafts",
      JSON.stringify([
        {
          id: "U-777",
          reporterName: "saved-user",
          role: "本人",
          needSummary: "需要協助確認狀況",
          locationClue: "不確定",
          note: "仍需要補充位置",
          categoryTags: ["地點"],
          humanReviewed: false,
          reviewDecision: "approved",
          demandTags: ["需要物資"],
          taskBlockerTags: [],
        },
      ]),
    );

    renderSignedInApp("reviewer");

    expect(screen.getAllByText("U-777").length).toBeGreaterThan(0);
    expect(screen.getByText("需要協助確認狀況")).toBeInTheDocument();
    expect(screen.getAllByText("需要物資").length).toBeGreaterThan(0);
    expect(screen.getByText("回報者：saved-user")).toBeInTheDocument();
    expect(screen.getByText("備註：仍需要補充位置")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "工作人員頁面" }));

    expect(screen.getAllByText("U-777").length).toBeGreaterThan(0);
    expect(screen.getByText("需要協助確認狀況")).toBeInTheDocument();
    expect(screen.getByText("仍需要補充位置")).toBeInTheDocument();
    expect(screen.getByText("saved-user")).toBeInTheDocument();
  });

  it("keeps draft CRUD as learner work instead of starter output", () => {
    renderSignedInApp();

    fireEvent.click(screen.getByRole("button", { name: "工作人員頁面" }));

    expect(screen.getByText("尚未建立整理草稿")).toBeInTheDocument();
    expect(screen.getByText(/這張卡只保留保守的安全邊界/)).toBeInTheDocument();
    expect(
      screen.queryByText(/已產生 \d+ 筆安全邊界草稿/),
    ).not.toBeInTheDocument();
  });
});
