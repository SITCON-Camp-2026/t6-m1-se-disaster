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
  onSelect,
  onUpdateReviewState,
}: {
  demandTagOptions: string[];
  records: Phase0MessyRecord[];
  reviewStates: Record<string, Phase0ReviewState>;
  selectedRecordId: string;
  taskBlockerTagOptions: string[];
  uploadReviewDrafts: Phase0UploadReviewDraft[];
  onSelect: (recordId: string) => void;
  onUpdateReviewState: (
    recordId: string,
    updater: (current: Phase0ReviewState) => Phase0ReviewState,
  ) => void;
}) {
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const safetyBoundary = createPhase0Judgement(selectedRecord);
  const selectedReviewState = reviewStates[selectedRecord.id] ?? {
    humanReviewed: false,
    demandTags: [],
    taskBlockerTags: [],
  };

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

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          {records.map((record) => (
            <button
              className={record.id === selectedRecord.id ? "active" : ""}
              key={record.id}
              type="button"
              onClick={() => onSelect(record.id)}
            >
              <span>{record.id}</span>
              <StatusBadge status={record.verificationStatus} />
              {reviewStates[record.id]?.humanReviewed ? (
                <span className="staff-mini-badge">已人工審核</span>
              ) : null}
            </button>
          ))}
        </aside>

        <div className="workbench__main">
          <RecordCard record={selectedRecord} />

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
                const isSelected = selectedReviewState.demandTags.includes(tag);

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
                          taskBlockerTags: current.taskBlockerTags.includes(tag)
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

          <Phase0JudgementCard
            judgement={safetyBoundary}
            record={selectedRecord}
          />
        </div>

        <aside className="workbench__checklist">
          <section className="upload-review-queue">
            <h3>災民上傳待查核</h3>
            {uploadReviewDrafts.length > 0 ? (
              <div className="upload-review-list">
                {uploadReviewDrafts.map((draft) => (
                  <article className="upload-review-item" key={draft.id}>
                    <div className="record-card__header">
                      <h4>{draft.id}</h4>
                      <span className="review-tag review-tag--blocker">
                        待人工確認
                      </span>
                    </div>
                    <p>{draft.needSummary || "未填寫協助內容"}</p>
                    <dl>
                      <div>
                        <dt>回報者</dt>
                        <dd>{draft.role}</dd>
                      </div>
                      <div>
                        <dt>地點線索</dt>
                        <dd>{draft.locationClue || "位置仍不清楚"}</dd>
                      </div>
                      <div>
                        <dt>補充資料</dt>
                        <dd>
                          {draft.uploadedFileNames.length > 0
                            ? draft.uploadedFileNames.join("、")
                            : "未選擇檔案"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted-text">目前沒有送交人工查核的上傳草稿</p>
            )}
          </section>

          <h3>第一階段完成檢查</h3>
          <ul>
            <li>Starter 已載入 {records.length} 筆原始資訊</li>
            <li>請 agent 加上建立、編輯、刪除或重設整理草稿</li>
            <li>至少讓 6 筆原始資訊被嘗試整理成可編輯草稿</li>
            <li>至少挑 2 個候選判斷由人類質疑或修正</li>
            <li>
              把資料品質問題寫進 observations，並記錄 agent 哪裡不能直接相信
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
