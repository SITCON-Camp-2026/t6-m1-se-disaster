import { useState } from "react";
import type {
  Phase0UploadCategoryTag,
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

const emptyDraft: Phase0UploadDraftInput = {
  role: "本人",
  needSummary: "",
  locationClue: "不確定",
  note: "",
  categoryTags: [],
  demandTags: [],
};

export function Phase0UploadPage({
  demandTagOptions,
  onSendToReview,
}: {
  demandTagOptions: string[];
  onSendToReview: (draft: Phase0UploadDraftInput) => void;
}) {
  const [draft, setDraft] = useState<Phase0UploadDraftInput>(emptyDraft);

  const canSubmit =
    draft.needSummary.trim().length > 0 ||
    draft.note.trim().length > 0 ||
    draft.categoryTags.length > 0 ||
    draft.demandTags.length > 0;

  return (
    <section className="upload-page" aria-label="災民上傳資料">
      <div className="upload-page__header">
        <div>
          <p className="eyebrow">災民上傳頁面</p>
          <h2>送出一筆待人工確認的原始資訊</h2>
          <p>
            這個頁面只建立前端暫存資料，不會上傳檔案，也不代表資料已被確認。
          </p>
        </div>
        <span className="review-tag review-tag--blocker">尚未查核</span>
      </div>

      <div className="upload-page__layout">
        <form
          className="upload-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) {
              return;
            }

            onSendToReview({
              ...draft,
              needSummary: draft.needSummary.trim(),
              note: draft.note.trim(),
            });
            setDraft(emptyDraft);
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
            <span>備註</span>
            <textarea
              placeholder="可以寫下你不確定的地方；請勿填真實完整地址、電話或個資。"
              value={draft.note}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
            />
          </label>

          <fieldset className="location-choice-group">
            <legend>分類</legend>
            <div className="location-choice-buttons">
              {categoryTagOptions.map((tag) => {
                const isSelected = draft.categoryTags.includes(tag);

                return (
                  <button
                    type="button"
                    className={isSelected ? "active" : ""}
                    aria-pressed={isSelected}
                    key={tag}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        categoryTags: current.categoryTags.includes(tag)
                          ? current.categoryTags.filter((item) => item !== tag)
                          : [...current.categoryTags, tag],
                      }))
                    }
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
                const isSelected = draft.demandTags.includes(tag);

                return (
                  <button
                    type="button"
                    className={isSelected ? "active" : ""}
                    aria-pressed={isSelected}
                    key={tag}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        demandTags: current.demandTags.includes(tag)
                          ? current.demandTags.filter((item) => item !== tag)
                          : [...current.demandTags, tag],
                      }))
                    }
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="upload-form__actions">
            <button type="submit" disabled={!canSubmit}>
              送出上傳
            </button>
            <button type="button" onClick={() => setDraft(emptyDraft)}>
              清除草稿
            </button>
          </div>
        </form>

        <aside className="upload-preview" aria-live="polite">
          <p className="eyebrow">送出前預覽</p>
          <h3>{canSubmit ? "這筆資料送出後會出現在查詢頁" : "尚未填寫"}</h3>
          <dl>
            <div>
              <dt>回報者身分</dt>
              <dd>{draft.role}</dd>
            </div>
            <div>
              <dt>協助內容</dt>
              <dd>{draft.needSummary || "未填寫"}</dd>
            </div>
            <div>
              <dt>地點線索</dt>
              <dd>{draft.locationClue}</dd>
            </div>
            <div>
              <dt>備註</dt>
              <dd>{draft.note || "未填寫"}</dd>
            </div>
            <div>
              <dt>分類</dt>
              <dd>
                {draft.categoryTags.length > 0
                  ? draft.categoryTags.join("、")
                  : "尚未標示"}
              </dd>
            </div>
            <div>
              <dt>上傳者標籤</dt>
              <dd>
                {draft.demandTags.length > 0
                  ? draft.demandTags.join("、")
                  : "尚未標示"}
              </dd>
            </div>
          </dl>
          <div className="review-tags">
            <span className="review-tag review-tag--blocker">尚未查核</span>
            <span className="review-tag review-tag--blocker">
              不能直接變成任務
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
