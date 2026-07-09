import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  it("renders the main processing entry title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊處理入口")).toBeInTheDocument();
  });

  it("keeps the home page focused on the staff workbench", () => {
    render(<App />);

    expect(
      screen.queryByRole("button", { name: "原始資訊" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "整理工作台" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("查詢頁面")).toBeInTheDocument();
    expect(screen.getByText("工作人員頁面")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "需求" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "時間" })).toBeInTheDocument();
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
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "工作人員頁面" }));

    expect(
      screen.getByText(
        "這裡提供工作人員修改、整理與補充判斷的空間。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("adds a classification search panel for phase 0 records", () => {
    render(<App />);

    expect(screen.getByText("分類查詢")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("搜尋關鍵字、地點或需求"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "需求" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "時間" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "地點" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "招募" })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("搜尋關鍵字、地點或需求"), {
      target: { value: "雨鞋" },
    });

    expect(screen.getAllByText(/雨鞋/i).length).toBeGreaterThan(0);
  });

  it("allows selecting multiple category buttons at once", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "時間" }));
    fireEvent.click(screen.getByRole("button", { name: "地點" }));

    expect(screen.getByRole("button", { name: "時間" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "地點" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("supports multi-select time buttons for morning noon and evening", () => {
    render(<App />);

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

  it("keeps draft CRUD as learner work instead of starter output", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "工作人員頁面" }));

    expect(screen.getByText("尚未建立整理草稿")).toBeInTheDocument();
    expect(
      screen.getByText(/請 agent 加上建立、編輯、刪除或重設整理草稿/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/已產生 \d+ 筆安全邊界草稿/),
    ).not.toBeInTheDocument();
  });
});
