import { useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0ClassificationPanel } from "../features/phase-0/Phase0ClassificationPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import type { Phase0MessyRecord } from "../features/phase-0/phase0-types";

type PageKey = "query" | "staff";

const phase0Records = messyReports satisfies Phase0MessyRecord[];

export function App() {
  const [page, setPage] = useState<PageKey>("query");
  const [selectedRecordId, setSelectedRecordId] = useState(
    phase0Records[0]?.id ?? "",
  );

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
      </nav>

      <section className="panel">
        {phase0Records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : page === "query" ? (
          <Phase0ClassificationPanel records={phase0Records} />
        ) : (
          <div className="panel__spacer">
            <Phase0Workbench
              records={phase0Records}
              selectedRecordId={selectedRecordId}
              onSelect={setSelectedRecordId}
            />
          </div>
        )}
      </section>
    </main>
  );
}
