import { useEffect, useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0ClassificationPanel } from "../features/phase-0/Phase0ClassificationPanel";
import { Phase0UploadPage } from "../features/phase-0/Phase0UploadPage";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import type {
  Phase0MessyRecord,
  Phase0ReviewState,
  Phase0UploadDraftInput,
  Phase0UploadReviewDraft,
} from "../features/phase-0/phase0-types";

type PageKey = "query" | "upload" | "staff";

const phase0Records = messyReports satisfies Phase0MessyRecord[];
const demandTagOptions = ["須自備工具", "不須自備工具", "需要物資"];
const taskBlockerTagOptions = [
  "地點不清楚",
  "時間不明",
  "來源未確認",
  "非當事人轉述",
  "可能有安全風險",
];
const uploadReviewDraftStorageKey = "phase0-upload-review-drafts";

function loadUploadReviewDrafts(): Phase0UploadReviewDraft[] {
  try {
    const storedValue = window.sessionStorage.getItem(
      uploadReviewDraftStorageKey,
    );

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
        "locationClue" in item &&
        "uploadedFileNames" in item,
    );
  } catch {
    return [];
  }
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

  useEffect(() => {
    window.sessionStorage.setItem(
      uploadReviewDraftStorageKey,
      JSON.stringify(uploadReviewDrafts),
    );
  }, [uploadReviewDrafts]);

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
    setUploadReviewDrafts((current) => [
      ...current,
      {
        ...draft,
        id: `U-${String(current.length + 1).padStart(3, "0")}`,
        humanReviewed: false,
        demandTags: [],
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
      current.map((draft) => (draft.id === draftId ? updater(draft) : draft)),
    );
  }

  function markUploadReviewDraftReviewed(draftId: string) {
    setUploadReviewDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId ? { ...draft, humanReviewed: true } : draft,
      ),
    );
  }

  function deleteUploadReviewDraft(draftId: string) {
    setUploadReviewDrafts((current) =>
      current.filter((draft) => draft.id !== draftId),
    );
  }

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
      </nav>

      <section className="panel">
        {phase0Records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : page === "query" ? (
          <Phase0ClassificationPanel
            demandTagOptions={demandTagOptions}
            records={phase0Records}
            reviewStates={reviewStates}
            taskBlockerTagOptions={taskBlockerTagOptions}
            uploadReviewDrafts={uploadReviewDrafts}
          />
        ) : page === "upload" ? (
          <Phase0UploadPage onSendToReview={sendUploadDraftToReview} />
        ) : (
          <div className="panel__spacer">
            <Phase0Workbench
              demandTagOptions={demandTagOptions}
              records={phase0Records}
              reviewStates={reviewStates}
              selectedRecordId={selectedRecordId}
              taskBlockerTagOptions={taskBlockerTagOptions}
              uploadReviewDrafts={uploadReviewDrafts}
              onMarkUploadReviewDraftReviewed={markUploadReviewDraftReviewed}
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
