import { useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import { createPhase0Judgement } from "./phase0-heuristics";
import type {
  Phase0MessyRecord,
  Phase0ReviewState,
  Phase0UploadReviewDraft,
} from "./phase0-types";

export function Phase0Workbench({
  demandTagOptions,
  records,
  reviewStates,
  selectedRecordId,
  taskBlockerTagOptions,
  uploadReviewDrafts,
  onMarkUploadReviewDraftReviewed,
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
  onMarkUploadReviewDraftReviewed: (draftId: string) => void;
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
        demandTags: selectedUploadDraft.demandTags ?? [],
        taskBlockerTags: selectedUploadDraft.taskBlockerTags ?? [],
      }
    : null;

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

      <section className="upload-review-inbox" aria-label="災民上傳待查核">
        <div>
          <p className="eyebrow">人工查核收件匣</p>
          <h3>災民上傳待查核</h3>
          <p>
            {uploadReviewDrafts.length > 0
              ? `收到 ${uploadReviewDrafts.length} 筆待人工確認草稿。`
              : "目前沒有送交人工查核的上傳草稿。"}
          </p>
        </div>
      </section>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇資料">
          {uploadReviewDrafts.map((draft) => (
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
                  draft.humanReviewed
                    ? "review-tag"
                    : "review-tag review-tag--blocker"
                }
              >
                {draft.humanReviewed ? "已人工審核" : "待人工確認"}
              </span>
            </button>
          ))}

          {records.map((record) => (
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
                    selectedUploadDraft.humanReviewed
                      ? "review-tag"
                      : "review-tag review-tag--blocker"
                  }
                >
                  {selectedUploadDraft.humanReviewed
                    ? "已人工審核"
                    : "待人工確認"}
                </span>
              </div>
              <p>{selectedUploadDraft.needSummary || "未填寫協助內容"}</p>
              <dl>
                <div>
                  <dt>回報者</dt>
                  <dd>{selectedUploadDraft.role}</dd>
                </div>
                <div>
                  <dt>地點線索</dt>
                  <dd>{selectedUploadDraft.locationClue || "位置仍不清楚"}</dd>
                </div>
                <div>
                  <dt>補充資料</dt>
                  <dd>
                    {selectedUploadDraft.uploadedFileNames.length > 0
                      ? selectedUploadDraft.uploadedFileNames.join("、")
                      : "未選擇檔案"}
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
                      {selectedUploadReviewState.humanReviewed
                        ? "已由人工看過"
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
                  disabled={selectedUploadDraft.humanReviewed}
                  onClick={() =>
                    onMarkUploadReviewDraftReviewed(selectedUploadDraft.id)
                  }
                >
                  {selectedUploadDraft.humanReviewed
                    ? "已人工審核"
                    : "標為已人工審核"}
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
