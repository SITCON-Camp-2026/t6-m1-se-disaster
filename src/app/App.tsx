import { useEffect, useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0ClassificationPanel } from "../features/phase-0/Phase0ClassificationPanel";
import { Phase0UploadPage } from "../features/phase-0/Phase0UploadPage";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import type {
  Phase0MessyRecord,
  Phase0ReviewState,
  Phase0ReporterRole,
  Phase0UploadCategoryTag,
  Phase0UploadDraftInput,
  Phase0UploadReviewDecision,
  Phase0UploadReviewDraft,
} from "../features/phase-0/phase0-types";

type PageKey = "query" | "upload" | "staff" | "rejected" | "reporter";
type LoginSession = {
  username: string;
};
type AuthMode = "login" | "register";
type TaskAcceptances = Record<string, string[]>;
type AcceptedTaskItem = {
  id: string;
  text: string;
  acceptedUsers: string[];
};

const phase0Records = messyReports satisfies Phase0MessyRecord[];
const demandTagOptions = ["須自備工具", "不須自備工具", "需要物資"];
const taskBlockerTagOptions = [
  "地點不清楚",
  "時間不明",
  "來源未確認",
  "非當事人轉述",
  "可能有安全風險",
];
const reporterRoles: Phase0ReporterRole[] = [
  "本人",
  "家屬代填",
  "現場志工協助",
  "其他",
];
const locationClueOptions = [
  "不確定",
  "活動中心",
  "車站",
  "學校",
  "老街",
  "路口",
  "溪畔",
  "大進",
];
const categoryTagOptions: Phase0UploadCategoryTag[] = ["地點", "需求", "招募"];
const uploadReviewDraftStorageKey = "phase0-upload-review-drafts";
const loginSessionStorageKey = "phase0-login-session";
const registeredUsersStorageKey = "phase0-registered-users";
const taskAcceptancesStorageKey = "phase0-task-acceptances";

function loadRegisteredUsers(): string[] {
  try {
    const storedValue =
      window.localStorage.getItem(registeredUsersStorageKey) ??
      window.sessionStorage.getItem(registeredUsersStorageKey);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  } catch {
    return [];
  }
}

function loadLoginSession(): LoginSession | null {
  try {
    const storedValue = window.sessionStorage.getItem(loginSessionStorageKey);

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (
      typeof parsedValue === "object" &&
      parsedValue !== null &&
      "username" in parsedValue &&
      typeof parsedValue.username === "string" &&
      parsedValue.username.trim().length > 0
    ) {
      return { username: parsedValue.username.trim() };
    }

    return null;
  } catch {
    return null;
  }
}

function loadUploadReviewDrafts(): Phase0UploadReviewDraft[] {
  try {
    const storedValue =
      window.localStorage.getItem(uploadReviewDraftStorageKey) ??
      window.sessionStorage.getItem(uploadReviewDraftStorageKey);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (item): item is Phase0UploadReviewDraft =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "needSummary" in item &&
        "locationClue" in item,
    );
  } catch {
    return [];
  }
}

function loadTaskAcceptances(): TaskAcceptances {
  try {
    const storedValue =
      window.localStorage.getItem(taskAcceptancesStorageKey) ??
      window.sessionStorage.getItem(taskAcceptancesStorageKey);

    if (!storedValue) {
      return {};
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (typeof parsedValue !== "object" || parsedValue === null) {
      return {};
    }

    const acceptances: TaskAcceptances = {};

    for (const [taskId, users] of Object.entries(
      parsedValue as Record<string, unknown>,
    )) {
      if (!Array.isArray(users)) {
        continue;
      }

      acceptances[taskId] = users.filter(
        (user: unknown): user is string =>
          typeof user === "string" && user.trim().length > 0,
      );
    }

    return acceptances;
  } catch {
    return {};
  }
}

function getUploadReviewDecision(
  draft: Phase0UploadReviewDraft,
): Phase0UploadReviewDecision {
  if (draft.reviewDecision) {
    return draft.reviewDecision;
  }

  return draft.humanReviewed ? "approved" : "pending";
}

function getUploadReviewDecisionLabel(draft: Phase0UploadReviewDraft) {
  if (draft.reporterCompleted) {
    return "已完成";
  }

  const decision = getUploadReviewDecision(draft);

  if (decision === "approved") {
    return "審核通過";
  }

  if (decision === "rejected") {
    return "未通過";
  }

  return "待審核";
}

function buildAcceptedTaskItems({
  approvedUploadReviewDrafts,
  currentUsername,
  records,
  reviewStates,
  taskAcceptances,
}: {
  approvedUploadReviewDrafts: Phase0UploadReviewDraft[];
  currentUsername: string;
  records: Phase0MessyRecord[];
  reviewStates: Record<string, Phase0ReviewState>;
  taskAcceptances: TaskAcceptances;
}): AcceptedTaskItem[] {
  const recordItems = records
    .filter(
      (record) => (reviewStates[record.id]?.taskBlockerTags ?? []).length === 0,
    )
    .map((record) => ({
      id: record.id,
      text: record.rawText,
      acceptedUsers: taskAcceptances[record.id] ?? [],
    }));
  const uploadItems = approvedUploadReviewDrafts
    .filter((draft) => (draft.taskBlockerTags ?? []).length === 0)
    .map((draft) => ({
      id: draft.id,
      text: draft.needSummary || "未填寫協助內容",
      acceptedUsers: taskAcceptances[draft.id] ?? [],
    }));

  return [...recordItems, ...uploadItems].filter((item) =>
    item.acceptedUsers.includes(currentUsername),
  );
}

function ReporterUploadsPage({
  acceptedTaskItems,
  demandTagOptions,
  drafts,
  onCancelAcceptedTask,
  onDelete,
  onMarkCompleted,
  onResubmit,
}: {
  acceptedTaskItems: AcceptedTaskItem[];
  demandTagOptions: string[];
  drafts: Phase0UploadReviewDraft[];
  onCancelAcceptedTask: (taskId: string) => void;
  onDelete: (draftId: string) => void;
  onMarkCompleted: (draftId: string) => void;
  onResubmit: (draftId: string, draft: Phase0UploadDraftInput) => void;
}) {
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Phase0UploadDraftInput | null>(
    null,
  );

  function startEditing(draft: Phase0UploadReviewDraft) {
    setEditingDraftId(draft.id);
    setEditDraft({
      reporterName: draft.reporterName,
      role: draft.role,
      needSummary: draft.needSummary,
      locationClue: draft.locationClue,
      note: draft.note,
      categoryTags: draft.categoryTags ?? [],
      demandTags: draft.demandTags ?? [],
    });
  }

  function toggleCategoryTag(tag: Phase0UploadCategoryTag) {
    setEditDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        categoryTags: current.categoryTags.includes(tag)
          ? current.categoryTags.filter((item) => item !== tag)
          : [...current.categoryTags, tag],
      };
    });
  }

  function toggleDemandTag(tag: string) {
    setEditDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        demandTags: current.demandTags.includes(tag)
          ? current.demandTags.filter((item) => item !== tag)
          : [...current.demandTags, tag],
      };
    });
  }

  return (
    <section className="reporter-panel" aria-label="登錄者資料管理">
      <div className="panel__header">
        <div>
          <h2>登錄者頁面</h2>
          <p>這裡可以查看、編輯、刪除自己的上傳資料，或標示已完成。</p>
        </div>
        <p>{drafts.length} 筆自己的資料</p>
      </div>

      {drafts.length === 0 ? (
        <EmptyState message="目前沒有你上傳的資料" />
      ) : (
        <div className="reporter-upload-list">
          {drafts.map((draft) => {
            const isEditing = editingDraftId === draft.id && editDraft;

            return (
              <article className="reporter-upload-card" key={draft.id}>
                <div className="record-card__header">
                  <div>
                    <p className="eyebrow">我的上傳資料</p>
                    <h3>{draft.id}</h3>
                  </div>
                  <span
                    className={
                      draft.reporterCompleted
                        ? "review-tag"
                        : "review-tag review-tag--blocker"
                    }
                  >
                    {getUploadReviewDecisionLabel(draft)}
                  </span>
                </div>

                {isEditing ? (
                  <form
                    className="reporter-edit-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!editDraft) {
                        return;
                      }

                      onResubmit(draft.id, {
                        ...editDraft,
                        needSummary: editDraft.needSummary.trim(),
                        note: editDraft.note.trim(),
                      });
                      setEditingDraftId(null);
                      setEditDraft(null);
                    }}
                  >
                    <label className="control-field">
                      <span>回報者身分</span>
                      <select
                        value={editDraft.role}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  role: event.target
                                    .value as Phase0ReporterRole,
                                }
                              : current,
                          )
                        }
                      >
                        {reporterRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="control-field">
                      <span>需要協助內容</span>
                      <textarea
                        value={editDraft.needSummary}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? { ...current, needSummary: event.target.value }
                              : current,
                          )
                        }
                      />
                    </label>

                    <fieldset className="location-choice-group">
                      <legend>地點線索</legend>
                      <div className="location-choice-buttons">
                        {locationClueOptions.map((location) => {
                          const isSelected =
                            editDraft.locationClue === location;

                          return (
                            <button
                              type="button"
                              className={isSelected ? "active" : ""}
                              aria-pressed={isSelected}
                              key={location}
                              onClick={() =>
                                setEditDraft((current) =>
                                  current
                                    ? { ...current, locationClue: location }
                                    : current,
                                )
                              }
                            >
                              {location}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    <label className="control-field">
                      <span>備註</span>
                      <textarea
                        value={editDraft.note}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? { ...current, note: event.target.value }
                              : current,
                          )
                        }
                      />
                    </label>

                    <fieldset className="location-choice-group">
                      <legend>分類</legend>
                      <div className="location-choice-buttons">
                        {categoryTagOptions.map((tag) => {
                          const isSelected =
                            editDraft.categoryTags.includes(tag);

                          return (
                            <button
                              type="button"
                              className={isSelected ? "active" : ""}
                              aria-pressed={isSelected}
                              key={tag}
                              onClick={() => toggleCategoryTag(tag)}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    <fieldset className="location-choice-group">
                      <legend>上傳者標籤</legend>
                      <div className="location-choice-buttons">
                        {demandTagOptions.map((tag) => {
                          const isSelected = editDraft.demandTags.includes(tag);

                          return (
                            <button
                              type="button"
                              className={isSelected ? "active" : ""}
                              aria-pressed={isSelected}
                              key={tag}
                              onClick={() => toggleDemandTag(tag)}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    <div className="reporter-upload-actions">
                      <button type="submit">重新送審</button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDraftId(null);
                          setEditDraft(null);
                        }}
                      >
                        取消編輯
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p>{draft.needSummary || "未填寫協助內容"}</p>
                    <dl className="rejected-record">
                      <div>
                        <dt>回報者身分</dt>
                        <dd>{draft.role}</dd>
                      </div>
                      <div>
                        <dt>地點線索</dt>
                        <dd>{draft.locationClue || "不確定"}</dd>
                      </div>
                      <div>
                        <dt>備註</dt>
                        <dd>{draft.note || "未填寫"}</dd>
                      </div>
                      <div>
                        <dt>分類</dt>
                        <dd>
                          {draft.categoryTags?.length
                            ? draft.categoryTags.join("、")
                            : "尚未標示"}
                        </dd>
                      </div>
                      <div>
                        <dt>上傳者標籤</dt>
                        <dd>
                          {draft.demandTags?.length
                            ? draft.demandTags.join("、")
                            : "尚未標示"}
                        </dd>
                      </div>
                    </dl>
                    <div className="reporter-upload-actions">
                      <button
                        type="button"
                        disabled={draft.reporterCompleted}
                        onClick={() => onMarkCompleted(draft.id)}
                      >
                        {draft.reporterCompleted ? "已完成" : "標示已完成"}
                      </button>
                      <button type="button" onClick={() => startEditing(draft)}>
                        編輯
                      </button>
                      <button
                        type="button"
                        className="reporter-upload-actions__delete"
                        onClick={() => onDelete(draft.id)}
                      >
                        刪除
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      <section className="accepted-task-panel" aria-label="我接受的任務">
        <div className="panel__header">
          <div>
            <h3>我接受的任務</h3>
            <p>這裡只列出目前登入者接受的查詢頁任務，可取消接受。</p>
          </div>
          <p>{acceptedTaskItems.length} 筆已接受</p>
        </div>

        {acceptedTaskItems.length === 0 ? (
          <EmptyState message="目前沒有你接受的任務" />
        ) : (
          <div className="accepted-task-list">
            {acceptedTaskItems.map((item) => (
              <article className="accepted-task-card" key={item.id}>
                <div>
                  <p className="eyebrow">已接受任務</p>
                  <h4>{item.id}</h4>
                </div>
                <p>{item.text}</p>
                <p className="accepted-task-card__users">
                  接受者：{item.acceptedUsers.join("、")}
                </p>
                <button
                  type="button"
                  onClick={() => onCancelAcceptedTask(item.id)}
                >
                  取消接受
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function RejectedUploadsPage({
  rejectedDrafts,
}: {
  rejectedDrafts: Phase0UploadReviewDraft[];
}) {
  return (
    <section className="rejected-panel" aria-label="未通過資料紀錄">
      <div className="panel__header">
        <div>
          <h2>未通過頁面</h2>
          <p>這裡只簡單紀錄審核未通過的上傳資料，不放進查詢頁。</p>
        </div>
        <p>{rejectedDrafts.length} 筆未通過</p>
      </div>

      {rejectedDrafts.length === 0 ? (
        <EmptyState message="目前沒有未通過資料" />
      ) : (
        <div className="grid">
          {rejectedDrafts.map((draft) => (
            <article
              className="record-card record-card--rejected"
              key={draft.id}
            >
              <div className="record-card__header">
                <h3>{draft.id}</h3>
                <span className="review-tag review-tag--blocker">未通過</span>
              </div>
              <p>{draft.needSummary || "未填寫協助內容"}</p>
              <dl className="rejected-record">
                <div>
                  <dt>回報者</dt>
                  <dd>{draft.reporterName || "未記錄"}</dd>
                </div>
                <div>
                  <dt>回報者身分</dt>
                  <dd>{draft.role}</dd>
                </div>
                <div>
                  <dt>地點線索</dt>
                  <dd>{draft.locationClue || "不確定"}</dd>
                </div>
                <div>
                  <dt>備註</dt>
                  <dd>{draft.note || "未填寫"}</dd>
                </div>
                <div>
                  <dt>分類</dt>
                  <dd>
                    {draft.categoryTags?.length
                      ? draft.categoryTags.join("、")
                      : "尚未標示"}
                  </dd>
                </div>
                <div>
                  <dt>未通過原因標籤</dt>
                  <dd>
                    {draft.taskBlockerTags?.length
                      ? draft.taskBlockerTags.join("、")
                      : "尚未標示"}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AuthGate({
  registeredUsers,
  onLogin,
  onRegister,
}: {
  registeredUsers: string[];
  onLogin: (username: string) => boolean;
  onRegister: (username: string) => boolean;
}) {
  const [mode, setMode] = useState<AuthMode>(
    registeredUsers.length > 0 ? "login" : "register",
  );
  const [authDraft, setAuthDraft] = useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const canSubmit =
    authDraft.username.trim().length > 0 &&
    authDraft.password.trim().length > 0;

  function submitAuth() {
    if (!canSubmit) {
      return;
    }

    const username = authDraft.username.trim();
    const succeeded =
      mode === "register" ? onRegister(username) : onLogin(username);

    if (succeeded) {
      setAuthDraft({ username: "", password: "" });
      setMessage("");
      return;
    }

    setMessage(
      mode === "register"
        ? "這個使用者名稱已註冊"
        : "找不到這個使用者名稱，請先註冊",
    );
  }

  return (
    <main className="layout">
      <section className="auth-page" aria-label="登入或註冊">
        <div className="auth-page__intro">
          <p className="eyebrow">SITCON Camp 2026</p>
          <h1>災害資訊處理入口</h1>
          <p>
            請先登入才進入工作台。這是前端展示用帳號流程，只記錄使用者名稱；密碼不會寫進回報草稿。
          </p>
        </div>

        <form
          className="auth-card"
          onSubmit={(event) => {
            event.preventDefault();
            submitAuth();
          }}
        >
          <div className="auth-card__header">
            <p className="eyebrow">帳號登錄</p>
            <h2>{mode === "register" ? "註冊帳號" : "登入帳號"}</h2>
          </div>

          <div className="auth-mode-switch" role="group" aria-label="帳號模式">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              aria-pressed={mode === "login"}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              登入
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              aria-pressed={mode === "register"}
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              註冊
            </button>
          </div>

          <label className="control-field">
            <span>使用者名稱</span>
            <input
              type="text"
              autoComplete="username"
              value={authDraft.username}
              onChange={(event) =>
                setAuthDraft((current) => ({
                  ...current,
                  username: event.target.value,
                }))
              }
            />
          </label>

          <label className="control-field">
            <span>密碼</span>
            <input
              type="password"
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              value={authDraft.password}
              onChange={(event) =>
                setAuthDraft((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </label>

          {message ? (
            <p className="auth-card__message" role="alert">
              {message}
            </p>
          ) : null}

          <button type="submit" disabled={!canSubmit}>
            {mode === "register" ? "建立帳號並登入" : "登入工作台"}
          </button>
        </form>
      </section>
    </main>
  );
}

export function App() {
  const [page, setPage] = useState<PageKey>("query");
  const [selectedRecordId, setSelectedRecordId] = useState(
    phase0Records[0]?.id ?? "",
  );
  const [reviewStates, setReviewStates] = useState<
    Record<string, Phase0ReviewState>
  >({});
  const [uploadReviewDrafts, setUploadReviewDrafts] = useState<
    Phase0UploadReviewDraft[]
  >(loadUploadReviewDrafts);
  const [loginSession, setLoginSession] = useState<LoginSession | null>(
    loadLoginSession,
  );
  const [registeredUsers, setRegisteredUsers] =
    useState<string[]>(loadRegisteredUsers);
  const [taskAcceptances, setTaskAcceptances] =
    useState<TaskAcceptances>(loadTaskAcceptances);

  useEffect(() => {
    window.localStorage.setItem(
      registeredUsersStorageKey,
      JSON.stringify(registeredUsers),
    );
  }, [registeredUsers]);

  useEffect(() => {
    function syncRegisteredUsers(event: StorageEvent) {
      if (event.key !== registeredUsersStorageKey) {
        return;
      }

      setRegisteredUsers(loadRegisteredUsers());
    }

    window.addEventListener("storage", syncRegisteredUsers);

    return () => window.removeEventListener("storage", syncRegisteredUsers);
  }, []);

  useEffect(() => {
    if (loginSession) {
      window.sessionStorage.setItem(
        loginSessionStorageKey,
        JSON.stringify(loginSession),
      );
      return;
    }

    window.sessionStorage.removeItem(loginSessionStorageKey);
  }, [loginSession]);

  useEffect(() => {
    window.localStorage.setItem(
      uploadReviewDraftStorageKey,
      JSON.stringify(uploadReviewDrafts),
    );
  }, [uploadReviewDrafts]);

  useEffect(() => {
    function syncUploadReviewDrafts(event: StorageEvent) {
      if (event.key !== uploadReviewDraftStorageKey) {
        return;
      }

      setUploadReviewDrafts(loadUploadReviewDrafts());
    }

    window.addEventListener("storage", syncUploadReviewDrafts);

    return () => window.removeEventListener("storage", syncUploadReviewDrafts);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      taskAcceptancesStorageKey,
      JSON.stringify(taskAcceptances),
    );
  }, [taskAcceptances]);

  useEffect(() => {
    function syncTaskAcceptances(event: StorageEvent) {
      if (event.key !== taskAcceptancesStorageKey) {
        return;
      }

      setTaskAcceptances(loadTaskAcceptances());
    }

    window.addEventListener("storage", syncTaskAcceptances);

    return () => window.removeEventListener("storage", syncTaskAcceptances);
  }, []);

  function updateReviewState(
    recordId: string,
    updater: (current: Phase0ReviewState) => Phase0ReviewState,
  ) {
    setReviewStates((current) => {
      const next = updater(
        current[recordId] ?? {
          humanReviewed: false,
          demandTags: [],
          taskBlockerTags: [],
        },
      );

      return { ...current, [recordId]: next };
    });
  }

  function sendUploadDraftToReview(draft: Phase0UploadDraftInput) {
    if (!loginSession) {
      return;
    }

    setUploadReviewDrafts((current) => [
      ...current,
      {
        ...draft,
        reporterName: loginSession.username,
        id: `U-${String(current.length + 1).padStart(3, "0")}`,
        humanReviewed: false,
        reviewDecision: "pending",
        demandTags: draft.demandTags,
        taskBlockerTags: [],
      },
    ]);
    setPage("staff");
  }

  function updateUploadReviewDraft(
    draftId: string,
    updater: (current: Phase0UploadReviewDraft) => Phase0UploadReviewDraft,
  ) {
    setUploadReviewDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId && draft.reporterName !== loginSession?.username
          ? updater(draft)
          : draft,
      ),
    );
  }

  function approveUploadReviewDraft(draftId: string) {
    if (
      uploadReviewDrafts.some(
        (draft) =>
          draft.id === draftId && draft.reporterName === loginSession?.username,
      )
    ) {
      return;
    }

    setUploadReviewDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId && draft.reporterName !== loginSession?.username
          ? { ...draft, humanReviewed: true, reviewDecision: "approved" }
          : draft,
      ),
    );
  }

  function rejectUploadReviewDraft(draftId: string) {
    if (
      uploadReviewDrafts.some(
        (draft) =>
          draft.id === draftId && draft.reporterName === loginSession?.username,
      )
    ) {
      return;
    }

    setUploadReviewDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId && draft.reporterName !== loginSession?.username
          ? { ...draft, humanReviewed: true, reviewDecision: "rejected" }
          : draft,
      ),
    );
    setPage("rejected");
  }

  function deleteUploadReviewDraft(draftId: string) {
    setUploadReviewDrafts((current) =>
      current.filter((draft) => draft.id !== draftId),
    );
    setTaskAcceptances((current) => {
      const remaining = { ...current };
      delete remaining[draftId];

      return remaining;
    });
  }

  function markOwnUploadCompleted(draftId: string) {
    setUploadReviewDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId && draft.reporterName === loginSession?.username
          ? { ...draft, reporterCompleted: true }
          : draft,
      ),
    );
  }

  function resubmitOwnUploadDraft(
    draftId: string,
    draftInput: Phase0UploadDraftInput,
  ) {
    setUploadReviewDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId && draft.reporterName === loginSession?.username
          ? {
              ...draft,
              ...draftInput,
              reporterName: draft.reporterName,
              humanReviewed: false,
              reporterCompleted: false,
              reviewDecision: "pending",
              demandTags: draftInput.demandTags,
              taskBlockerTags: [],
            }
          : draft,
      ),
    );
    setPage("staff");
  }

  function toggleTaskAcceptance(taskId: string) {
    setTaskAcceptances((current) => {
      const acceptedUsers = current[taskId] ?? [];
      const username = loginSession?.username ?? "";

      if (!username) {
        return current;
      }

      if (acceptedUsers.includes(username)) {
        const remainingUsers = acceptedUsers.filter(
          (user) => user !== username,
        );

        if (remainingUsers.length === 0) {
          const remaining = { ...current };
          delete remaining[taskId];

          return remaining;
        }

        return {
          ...current,
          [taskId]: remainingUsers,
        };
      }

      return {
        ...current,
        [taskId]: [...acceptedUsers, username],
      };
    });
  }

  function loginWithUsername(username: string) {
    if (!registeredUsers.includes(username)) {
      return false;
    }

    setLoginSession({ username });
    return true;
  }

  function registerWithUsername(username: string) {
    if (registeredUsers.includes(username)) {
      return false;
    }

    setRegisteredUsers((current) => [...current, username]);
    setLoginSession({ username });
    return true;
  }

  if (!loginSession) {
    return (
      <AuthGate
        registeredUsers={registeredUsers}
        onLogin={loginWithUsername}
        onRegister={registerWithUsername}
      />
    );
  }

  const approvedUploadReviewDrafts = uploadReviewDrafts.filter(
    (draft) =>
      getUploadReviewDecision(draft) === "approved" && !draft.reporterCompleted,
  );
  const rejectedUploadReviewDrafts = uploadReviewDrafts.filter(
    (draft) => getUploadReviewDecision(draft) === "rejected",
  );
  const ownUploadReviewDrafts = uploadReviewDrafts.filter(
    (draft) => draft.reporterName === loginSession.username,
  );
  const acceptedTaskItems = buildAcceptedTaskItems({
    approvedUploadReviewDrafts,
    currentUsername: loginSession.username,
    records: phase0Records,
    reviewStates,
    taskAcceptances,
  });

  return (
    <main className="layout">
      <header className="hero">
        <p className="eyebrow">SITCON Camp 2026</p>
        <h1>災害資訊處理入口</h1>
        <p>
          第一階段先用 coding agent
          做出可展示的前端原型，再從成果中看見資料品質、角色、狀態與來源的限制。
        </p>
      </header>

      <nav className="tabs" aria-label="處理頁面切換">
        <button
          type="button"
          className={page === "query" ? "active" : ""}
          onClick={() => setPage("query")}
        >
          查詢頁面
        </button>
        <button
          type="button"
          className={page === "staff" ? "active" : ""}
          onClick={() => setPage("staff")}
        >
          工作人員頁面
        </button>
        <button
          type="button"
          className={page === "upload" ? "active" : ""}
          onClick={() => setPage("upload")}
        >
          災民上傳頁面
        </button>
        <button
          type="button"
          className={page === "reporter" ? "active" : ""}
          onClick={() => setPage("reporter")}
        >
          登錄者頁面
        </button>
        <button
          type="button"
          className={page === "rejected" ? "active" : ""}
          onClick={() => setPage("rejected")}
        >
          未通過頁面
        </button>
        <div className="tabs__account" aria-label="目前登入帳號">
          <span>目前使用者：{loginSession.username}</span>
          <button type="button" onClick={() => setLoginSession(null)}>
            登出
          </button>
        </div>
      </nav>

      <section className="panel">
        {phase0Records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : page === "query" ? (
          <Phase0ClassificationPanel
            currentUsername={loginSession.username}
            demandTagOptions={demandTagOptions}
            records={phase0Records}
            reviewStates={reviewStates}
            taskAcceptances={taskAcceptances}
            uploadReviewDrafts={approvedUploadReviewDrafts}
            onToggleTaskAcceptance={toggleTaskAcceptance}
          />
        ) : page === "upload" ? (
          <Phase0UploadPage
            demandTagOptions={demandTagOptions}
            loginSession={loginSession}
            onSendToReview={sendUploadDraftToReview}
          />
        ) : page === "reporter" ? (
          <ReporterUploadsPage
            acceptedTaskItems={acceptedTaskItems}
            demandTagOptions={demandTagOptions}
            drafts={ownUploadReviewDrafts}
            onCancelAcceptedTask={toggleTaskAcceptance}
            onDelete={deleteUploadReviewDraft}
            onMarkCompleted={markOwnUploadCompleted}
            onResubmit={resubmitOwnUploadDraft}
          />
        ) : page === "rejected" ? (
          <RejectedUploadsPage rejectedDrafts={rejectedUploadReviewDrafts} />
        ) : (
          <div className="panel__spacer">
            <Phase0Workbench
              currentUsername={loginSession.username}
              demandTagOptions={demandTagOptions}
              records={phase0Records}
              reviewStates={reviewStates}
              selectedRecordId={selectedRecordId}
              taskBlockerTagOptions={taskBlockerTagOptions}
              uploadReviewDrafts={uploadReviewDrafts}
              onApproveUploadReviewDraft={approveUploadReviewDraft}
              onRejectUploadReviewDraft={rejectUploadReviewDraft}
              onDeleteUploadReviewDraft={deleteUploadReviewDraft}
              onSelect={setSelectedRecordId}
              onUpdateReviewState={updateReviewState}
              onUpdateUploadReviewDraft={updateUploadReviewDraft}
            />
          </div>
        )}
      </section>
    </main>
  );
}
