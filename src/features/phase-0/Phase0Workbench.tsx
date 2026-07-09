import { useMemo, useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import { createPhase0Judgement } from "./phase0-heuristics";
import type {
  Phase0MessyRecord,
  Phase0ReviewState,
  Phase0UploadReviewDecision,
  Phase0UploadReviewDraft,
} from "./phase0-types";

type StaffQueueFilter =
  "all" | "uploads" | "records" | "needsReview" | "approved" | "rejected";

const staffQueueFilters: { key: StaffQueueFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "uploads", label: "災民上傳" },
  { key: "records", label: "原始資料" },
  { key: "needsReview", label: "待人工確認" },
  { key: "approved", label: "審核通過" },
  { key: "rejected", label: "未通過" },
];

function getUploadReviewDecision(
  draft: Phase0UploadReviewDraft,
): Phase0UploadReviewDecision {
  if (draft.reviewDecision) {
    return draft.reviewDecision;
  }

  return draft.humanReviewed ? "approved" : "pending";
}

function getUploadReviewLabel(draft: Phase0UploadReviewDraft) {
  const decision = getUploadReviewDecision(draft);

  if (decision === "approved") {
    return "審核通過";
  }

  if (decision === "rejected") {
    return "未通過";
  }

  return "待人工確認";
}

export function Phase0Workbench({
  demandTagOptions,
  records,
  reviewStates,
  selectedRecordId,
  taskBlockerTagOptions,
  uploadReviewDrafts,
  onApproveUploadReviewDraft,
  onRejectUploadReviewDraft,
  onDeleteUploadReviewDraft,
  onSelect,
  onUpdateReviewState,
  onUpdateUploadReviewDraft,
}: {
  demandTagOptions: string[];
  records: Phase0MessyRecord[];
  reviewStates: Record<string, Phase0ReviewState>;
  selectedRecordId: string;
  taskBlockerTagOptions: string[];
  uploadReviewDrafts: Phase0UploadReviewDraft[];
  onApproveUploadReviewDraft: (draftId: string) => void;
  onRejectUploadReviewDraft: (draftId: string) => void;
  onDeleteUploadReviewDraft: (draftId: string) => void;
  onSelect: (recordId: string) => void;
  onUpdateReviewState: (
    recordId: string,
    updater: (current: Phase0ReviewState) => Phase0ReviewState,
  ) => void;
  onUpdateUploadReviewDraft: (
    draftId: string,
    updater: (current: Phase0UploadReviewDraft) => Phase0UploadReviewDraft,
  ) => void;
}) {
  const [selectedUploadDraftId, setSelectedUploadDraftId] = useState<
    string | null
  >(null);
  const [staffQueueSearchTerm, setStaffQueueSearchTerm] = useState("");
  const [staffQueueFilter, setStaffQueueFilter] =
    useState<StaffQueueFilter>("all");
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const selectedUploadDraft =
    selectedUploadDraftId === ""
      ? null
      : (uploadReviewDrafts.find(
          (draft) => draft.id === selectedUploadDraftId,
        ) ??
        uploadReviewDrafts.at(-1) ??
        null);
  const safetyBoundary = createPhase0Judgement(selectedRecord);
  const selectedReviewState = reviewStates[selectedRecord.id] ?? {
    humanReviewed: false,
    demandTags: [],
    taskBlockerTags: [],
  };
  const selectedUploadReviewState = selectedUploadDraft
    ? {
        humanReviewed: Boolean(selectedUploadDraft.humanReviewed),
        reviewDecision: getUploadReviewDecision(selectedUploadDraft),
        demandTags: selectedUploadDraft.demandTags ?? [],
        taskBlockerTags: selectedUploadDraft.taskBlockerTags ?? [],
      }
    : null;
  const normalizedStaffQueueSearch = staffQueueSearchTerm.trim().toLowerCase();
  const filteredUploadReviewDrafts = useMemo(
    () =>
      uploadReviewDrafts.filter((draft) => {
        const decision = getUploadReviewDecision(draft);
        const haystack = [
          draft.id,
          draft.reporterName,
          draft.role,
          draft.needSummary,
          draft.locationClue,
          draft.note,
          getUploadReviewLabel(draft),
          decision === "approved" ? "已人工審核 人工看過" : "",
          decision === "rejected" ? "審核沒過 退回" : "",
          decision === "pending" ? "待人工確認 尚未查核" : "",
          "災民上傳 上傳草稿",
          ...(draft.categoryTags ?? []),
          ...(draft.demandTags ?? []),
          ...(draft.taskBlockerTags ?? []),
        ]
          .join(" ")
          .toLowerCase();
        const matchesSearch =
          normalizedStaffQueueSearch.length === 0 ||
          haystack.includes(normalizedStaffQueueSearch);
        const matchesFilter =
          staffQueueFilter === "all" ||
          staffQueueFilter === "uploads" ||
          (staffQueueFilter === "needsReview" && decision === "pending") ||
          (staffQueueFilter === "approved" && decision === "approved") ||
          (staffQueueFilter === "rejected" && decision === "rejected");

        return matchesSearch && matchesFilter;
      }),
    [normalizedStaffQueueSearch, staffQueueFilter, uploadReviewDrafts],
  );
  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const reviewState = reviewStates[record.id];
        const haystack = [
          record.id,
          record.rawText,
          record.sourceType,
          record.verificationStatus,
          reviewState?.humanReviewed ? "已人工審核 人工看過" : "待人工確認",
          ...(reviewState?.demandTags ?? []),
          ...(reviewState?.taskBlockerTags ?? []),
          "原始資料",
        ]
          .join(" ")
          .toLowerCase();
        const matchesSearch =
          normalizedStaffQueueSearch.length === 0 ||
          haystack.includes(normalizedStaffQueueSearch);
        const matchesFilter =
          staffQueueFilter === "all" ||
          staffQueueFilter === "records" ||
          (staffQueueFilter === "needsReview" && !reviewState?.humanReviewed) ||
          (staffQueueFilter === "approved" &&
            Boolean(reviewState?.humanReviewed));

        return matchesSearch && matchesFilter;
      }),
    [normalizedStaffQueueSearch, records, reviewStates, staffQueueFilter],
  );
  const filteredQueueCount =
    filteredUploadReviewDrafts.length + filteredRecords.length;
  const allQueueCount = uploadReviewDrafts.length + records.length;

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">工作人員頁面</p>
        <h2>這裡提供工作人員修改、整理與補充判斷的空間。</h2>
        <p>
          這裡先只標示安全邊界，真正的候選判斷要由小組和 coding agent
          補上；這不是 runtime LLM 分析，也不是正式資料模型。
        </p>
      </div>

      <section className="upload-review-inbox" aria-label="災民上傳資料">
        <div>
          <p className="eyebrow">人工查核收件匣</p>
          <h3>災民上傳資料</h3>
          <p>
            {uploadReviewDrafts.length > 0
              ? `收到 ${uploadReviewDrafts.length} 筆上傳資料，審核通過後才會出現在查詢頁。`
              : "目前沒有送出的上傳資料。"}
          </p>
        </div>
      </section>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇資料">
          <div className="staff-queue-search">
            <label className="control-field">
              <span>工作人員分類搜尋</span>
              <input
                type="text"
                placeholder="搜尋編號、來源、回報者或標籤"
                value={staffQueueSearchTerm}
                onChange={(event) =>
                  setStaffQueueSearchTerm(event.target.value)
                }
              />
            </label>

            <div className="staff-queue-filter" aria-label="工作人員分類篩選">
              {staffQueueFilters.map((filter) => {
                const isSelected = staffQueueFilter === filter.key;

                return (
                  <button
                    type="button"
                    className={isSelected ? "active" : ""}
                    aria-pressed={isSelected}
                    key={filter.key}
                    onClick={() => setStaffQueueFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <p>
              {filteredQueueCount} / {allQueueCount} 筆符合
            </p>
          </div>

          {filteredQueueCount === 0 ? (
            <p className="staff-queue-empty">沒有符合條件的資料</p>
          ) : null}

          {filteredUploadReviewDrafts.map((draft) => (
            <button
              className={
                selectedUploadDraft?.id === draft.id
                  ? "workbench__queue-upload active"
                  : "workbench__queue-upload"
              }
              key={draft.id}
              type="button"
              onClick={() => setSelectedUploadDraftId(draft.id)}
            >
              <span>{draft.id}</span>
              <span className="staff-mini-badge staff-mini-badge--upload">
                災民上傳
              </span>
              <span
                className={
                  getUploadReviewDecision(draft) === "approved"
                    ? "review-tag"
                    : "review-tag review-tag--blocker"
                }
              >
                {getUploadReviewLabel(draft)}
              </span>
            </button>
          ))}

          {filteredRecords.map((record) => (
            <button
              className={
                !selectedUploadDraft && record.id === selectedRecord.id
                  ? "active"
                  : ""
              }
              key={record.id}
              type="button"
              onClick={() => {
                setSelectedUploadDraftId("");
                onSelect(record.id);
              }}
            >
              <span>{record.id}</span>
              <span className="staff-mini-badge staff-mini-badge--fixture">
                原始資料
              </span>
              <StatusBadge status={record.verificationStatus} />
              {reviewStates[record.id]?.humanReviewed ? (
                <span className="staff-mini-badge">已人工審核</span>
              ) : null}
            </button>
          ))}
        </aside>

        <div className="workbench__main">
          {selectedUploadDraft ? (
            <article className="upload-review-detail">
              <div className="record-card__header">
                <div>
                  <p className="eyebrow">災民上傳草稿</p>
                  <h3>{selectedUploadDraft.id}</h3>
                </div>
                <span
                  className={
                    getUploadReviewDecision(selectedUploadDraft) === "approved"
                      ? "review-tag"
                      : "review-tag review-tag--blocker"
                  }
                >
                  {getUploadReviewLabel(selectedUploadDraft)}
                </span>
              </div>
              <p>{selectedUploadDraft.needSummary || "未填寫協助內容"}</p>
              <dl>
                <div>
                  <dt>回報者帳號</dt>
                  <dd>{selectedUploadDraft.reporterName || "未記錄"}</dd>
                </div>
                <div>
                  <dt>回報者身分</dt>
                  <dd>{selectedUploadDraft.role}</dd>
                </div>
                <div>
                  <dt>地點線索</dt>
                  <dd>{selectedUploadDraft.locationClue || "不確定"}</dd>
                </div>
                <div>
                  <dt>備註</dt>
                  <dd>{selectedUploadDraft.note || "未填寫"}</dd>
                </div>
                <div>
                  <dt>分類</dt>
                  <dd>
                    {selectedUploadDraft.categoryTags?.length
                      ? selectedUploadDraft.categoryTags.join("、")
                      : "尚未標示"}
                  </dd>
                </div>
                <div>
                  <dt>上傳者標籤</dt>
                  <dd>
                    {selectedUploadReviewState?.demandTags.length
                      ? selectedUploadReviewState.demandTags.join("、")
                      : "尚未標示"}
                  </dd>
                </div>
              </dl>
              {selectedUploadReviewState ? (
                <section
                  className="staff-review-panel"
                  aria-label="上傳草稿人工審核標示"
                >
                  <div>
                    <p className="eyebrow">人工標示</p>
                    <h3>審核與需求分類</h3>
                    <p>
                      這些標示只代表工作人員看過與整理過，不代表上傳內容已被確認為事實。
                    </p>
                  </div>

                  <div className="staff-review-actions">
                    {demandTagOptions.map((tag) => {
                      const isSelected =
                        selectedUploadReviewState.demandTags.includes(tag);

                      return (
                        <button
                          type="button"
                          className={
                            isSelected
                              ? "staff-review-button active"
                              : "staff-review-button"
                          }
                          aria-pressed={isSelected}
                          key={tag}
                          onClick={() =>
                            onUpdateUploadReviewDraft(
                              selectedUploadDraft.id,
                              (current) => {
                                const demandTags = current.demandTags ?? [];

                                return {
                                  ...current,
                                  demandTags: demandTags.includes(tag)
                                    ? demandTags.filter((item) => item !== tag)
                                    : [...demandTags, tag],
                                };
                              },
                            )
                          }
                        >
                          需求分類：{tag}
                        </button>
                      );
                    })}
                  </div>

                  <div className="staff-review-group">
                    <h4>不能直接變成任務的原因</h4>
                    <div className="staff-review-actions">
                      {taskBlockerTagOptions.map((tag) => {
                        const isSelected =
                          selectedUploadReviewState.taskBlockerTags.includes(
                            tag,
                          );

                        return (
                          <button
                            type="button"
                            className={
                              isSelected
                                ? "staff-review-button staff-review-button--warning active"
                                : "staff-review-button staff-review-button--warning"
                            }
                            aria-pressed={isSelected}
                            key={tag}
                            onClick={() =>
                              onUpdateUploadReviewDraft(
                                selectedUploadDraft.id,
                                (current) => {
                                  const taskBlockerTags =
                                    current.taskBlockerTags ?? [];

                                  return {
                                    ...current,
                                    taskBlockerTags: taskBlockerTags.includes(
                                      tag,
                                    )
                                      ? taskBlockerTags.filter(
                                          (item) => item !== tag,
                                        )
                                      : [...taskBlockerTags, tag],
                                  };
                                },
                              )
                            }
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="staff-review-summary" aria-live="polite">
                    <span>
                      審核狀態：
                      {selectedUploadReviewState.reviewDecision === "approved"
                        ? "審核通過"
                        : selectedUploadReviewState.reviewDecision ===
                            "rejected"
                          ? "未通過"
                          : "尚未由人工看過"}
                    </span>
                    <span>
                      需求分類：
                      {selectedUploadReviewState.demandTags.length > 0
                        ? selectedUploadReviewState.demandTags.join("、")
                        : "尚未標示"}
                    </span>
                    <span>
                      不能直接變成任務：
                      {selectedUploadReviewState.taskBlockerTags.length > 0
                        ? selectedUploadReviewState.taskBlockerTags.join("、")
                        : "尚未標示"}
                    </span>
                  </div>
                </section>
              ) : null}
              <div className="upload-review-detail__actions">
                <button
                  type="button"
                  className="upload-review-detail__review"
                  disabled={
                    getUploadReviewDecision(selectedUploadDraft) === "approved"
                  }
                  onClick={() =>
                    onApproveUploadReviewDraft(selectedUploadDraft.id)
                  }
                >
                  {getUploadReviewDecision(selectedUploadDraft) === "approved"
                    ? "已審核通過"
                    : "標為審核通過"}
                </button>
                <button
                  type="button"
                  className="upload-review-detail__reject"
                  disabled={
                    getUploadReviewDecision(selectedUploadDraft) === "rejected"
                  }
                  onClick={() =>
                    onRejectUploadReviewDraft(selectedUploadDraft.id)
                  }
                >
                  {getUploadReviewDecision(selectedUploadDraft) === "rejected"
                    ? "已標為未通過"
                    : "標為未通過"}
                </button>
                <button
                  type="button"
                  className="upload-review-detail__delete"
                  onClick={() => {
                    onDeleteUploadReviewDraft(selectedUploadDraft.id);
                    setSelectedUploadDraftId("");
                  }}
                >
                  刪除這筆上傳草稿
                </button>
              </div>
            </article>
          ) : (
            <RecordCard record={selectedRecord} />
          )}

          {!selectedUploadDraft ? (
            <section className="staff-review-panel" aria-label="人工審核標示">
              <div>
                <p className="eyebrow">人工標示</p>
                <h3>審核與需求分類</h3>
                <p>
                  這些標示只代表小組目前的人工整理狀態，不代表原始資訊已被確認為事實。
                </p>
              </div>

              <div className="staff-review-actions">
                <button
                  type="button"
                  className={
                    selectedReviewState.humanReviewed
                      ? "staff-review-button active"
                      : "staff-review-button"
                  }
                  aria-pressed={selectedReviewState.humanReviewed}
                  onClick={() =>
                    onUpdateReviewState(selectedRecord.id, (current) => ({
                      ...current,
                      humanReviewed: !current.humanReviewed,
                    }))
                  }
                >
                  {selectedReviewState.humanReviewed
                    ? "已人工審核"
                    : "標為已人工審核"}
                </button>

                {demandTagOptions.map((tag) => {
                  const isSelected =
                    selectedReviewState.demandTags.includes(tag);

                  return (
                    <button
                      type="button"
                      className={
                        isSelected
                          ? "staff-review-button active"
                          : "staff-review-button"
                      }
                      aria-pressed={isSelected}
                      key={tag}
                      onClick={() =>
                        onUpdateReviewState(selectedRecord.id, (current) => ({
                          ...current,
                          demandTags: current.demandTags.includes(tag)
                            ? current.demandTags.filter((item) => item !== tag)
                            : [...current.demandTags, tag],
                        }))
                      }
                    >
                      需求分類：{tag}
                    </button>
                  );
                })}
              </div>

              <div className="staff-review-group">
                <h4>不能直接變成任務的原因</h4>
                <div className="staff-review-actions">
                  {taskBlockerTagOptions.map((tag) => {
                    const isSelected =
                      selectedReviewState.taskBlockerTags.includes(tag);

                    return (
                      <button
                        type="button"
                        className={
                          isSelected
                            ? "staff-review-button staff-review-button--warning active"
                            : "staff-review-button staff-review-button--warning"
                        }
                        aria-pressed={isSelected}
                        key={tag}
                        onClick={() =>
                          onUpdateReviewState(selectedRecord.id, (current) => ({
                            ...current,
                            taskBlockerTags: current.taskBlockerTags.includes(
                              tag,
                            )
                              ? current.taskBlockerTags.filter(
                                  (item) => item !== tag,
                                )
                              : [...current.taskBlockerTags, tag],
                          }))
                        }
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="staff-review-summary" aria-live="polite">
                <span>
                  審核狀態：
                  {selectedReviewState.humanReviewed
                    ? "已由人工看過"
                    : "尚未由人工看過"}
                </span>
                <span>
                  需求分類：
                  {selectedReviewState.demandTags.length > 0
                    ? selectedReviewState.demandTags.join("、")
                    : "尚未標示"}
                </span>
                <span>
                  不能直接變成任務：
                  {selectedReviewState.taskBlockerTags.length > 0
                    ? selectedReviewState.taskBlockerTags.join("、")
                    : "尚未標示"}
                </span>
              </div>
            </section>
          ) : null}

          {!selectedUploadDraft ? (
            <Phase0JudgementCard
              judgement={safetyBoundary}
              record={selectedRecord}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
