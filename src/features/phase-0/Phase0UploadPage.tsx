import { useState } from "react";
import type {
  Phase0ReporterRole,
  Phase0UploadDraftInput,
} from "./phase0-types";

const reporterRoles: Phase0ReporterRole[] = [
  "本人",
  "家屬代填",
  "現場志工協助",
  "其他",
];

const locationClueOptions = [
  "活動中心附近",
  "車站附近",
  "學校附近",
  "老街附近",
  "路口附近",
  "位置仍不清楚",
];

const emptyDraft: Phase0UploadDraftInput = {
  role: "本人",
  needSummary: "",
  locationClue: "位置仍不清楚",
  uploadedFileNames: [],
};

export function Phase0UploadPage({
  onSendToReview,
}: {
  onSendToReview: (draft: Phase0UploadDraftInput) => void;
}) {
  const [draft, setDraft] = useState<Phase0UploadDraftInput>(emptyDraft);
  const [submittedDraft, setSubmittedDraft] =
    useState<Phase0UploadDraftInput | null>(null);
  const [sentToReview, setSentToReview] = useState(false);

  const canSubmit =
    draft.needSummary.trim().length > 0 || draft.uploadedFileNames.length > 0;

  return (
    <section className="upload-page" aria-label="災民上傳資料">
      <div className="upload-page__header">
        <div>
          <p className="eyebrow">災民上傳頁面</p>
          <h2>建立待人工確認的原始資訊草稿</h2>
          <p>
            這個頁面只建立前端暫存草稿，不會真的上傳檔案，也不代表資料已被確認。
          </p>
        </div>
        <span className="review-tag review-tag--blocker">待人工確認</span>
      </div>

      <div className="upload-page__layout">
        <form
          className="upload-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) {
              return;
            }

            setSubmittedDraft({
              ...draft,
              needSummary: draft.needSummary.trim(),
              locationClue: draft.locationClue.trim(),
            });
            setSentToReview(false);
          }}
        >
          <label className="control-field">
            <span>回報者身分</span>
            <select
              value={draft.role}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  role: event.target.value as Phase0ReporterRole,
                }))
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
              placeholder="例如：需要搬動大型家具、缺少飲用水、需要確認藥品需求"
              value={draft.needSummary}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  needSummary: event.target.value,
                }))
              }
            />
          </label>

          <fieldset className="location-choice-group">
            <legend>地點線索</legend>
            <div className="location-choice-buttons">
              {locationClueOptions.map((location) => {
                const isSelected = draft.locationClue === location;

                return (
                  <button
                    type="button"
                    className={isSelected ? "active" : ""}
                    aria-pressed={isSelected}
                    key={location}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        locationClue: location,
                      }))
                    }
                  >
                    {location}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="control-field">
            <span>其他地點描述</span>
            <input
              type="text"
              placeholder="若上方都不適合，可填模糊線索；請勿填真實完整地址"
              value={
                locationClueOptions.includes(draft.locationClue)
                  ? ""
                  : draft.locationClue
              }
              onChange={(event) => {
                const nextLocation = event.target.value.trim();
                setDraft((current) => ({
                  ...current,
                  locationClue: nextLocation || "位置仍不清楚",
                }));
              }}
            />
          </label>

          <label className="control-field upload-dropzone">
            <span>補充資料</span>
            <input
              type="file"
              multiple
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  uploadedFileNames: Array.from(
                    event.target.files ?? [],
                    (file) => file.name,
                  ),
                }))
              }
            />
            <small>Phase 0 請勿放入真實照片、電話、完整地址或個資。</small>
            {draft.uploadedFileNames.length > 0 ? (
              <div className="selected-file-list" aria-live="polite">
                <span>已選擇檔案</span>
                <ul>
                  {draft.uploadedFileNames.map((fileName) => (
                    <li key={fileName}>{fileName}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </label>

          <div className="upload-form__actions">
            <button type="submit" disabled={!canSubmit}>
              建立待審核草稿
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(emptyDraft);
                setSubmittedDraft(null);
                setSentToReview(false);
              }}
            >
              清除草稿
            </button>
          </div>
        </form>

        <aside className="upload-preview" aria-live="polite">
          <p className="eyebrow">草稿預覽</p>
          {submittedDraft ? (
            <>
              <h3>已建立一筆待人工確認草稿</h3>
              <dl>
                <div>
                  <dt>回報者身分</dt>
                  <dd>{submittedDraft.role}</dd>
                </div>
                <div>
                  <dt>協助內容</dt>
                  <dd>{submittedDraft.needSummary || "未填寫"}</dd>
                </div>
                <div>
                  <dt>地點線索</dt>
                  <dd>{submittedDraft.locationClue || "未填寫"}</dd>
                </div>
                <div>
                  <dt>補充資料</dt>
                  <dd>
                    {submittedDraft.uploadedFileNames.length > 0
                      ? submittedDraft.uploadedFileNames.join("、")
                      : "未選擇檔案"}
                  </dd>
                </div>
              </dl>
              <div className="review-tags">
                <span className="review-tag review-tag--blocker">尚未查核</span>
                <span className="review-tag review-tag--blocker">
                  不能直接變成任務
                </span>
                {sentToReview ? (
                  <span className="review-tag">已送交人工查核</span>
                ) : null}
              </div>
              <button
                type="button"
                className="upload-send-button"
                disabled={sentToReview}
                onClick={() => {
                  onSendToReview(submittedDraft);
                  setSentToReview(true);
                }}
              >
                {sentToReview ? "已送交人工查核" : "送交人工查核"}
              </button>
            </>
          ) : (
            <div className="empty-state">
              填寫內容後，這裡會出現待人工確認的草稿摘要。
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
