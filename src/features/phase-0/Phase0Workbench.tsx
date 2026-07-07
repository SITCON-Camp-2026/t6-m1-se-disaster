import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import { createPhase0Judgement } from "./phase0-heuristics";
import type { Phase0MessyRecord } from "./phase0-types";

export function Phase0Workbench({
  records,
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const judgements = records.map(createPhase0Judgement);
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const selectedJudgement =
    judgements.find(
      (judgement) => judgement.messyRecordId === selectedRecord.id,
    ) ?? judgements[0];
  const unsafeCount = judgements.filter(
    (judgement) => judgement.unsafeToActDirectly,
  ).length;
  const humanReviewCount = judgements.filter((judgement) =>
    judgement.blockers.some((blocker) => blocker.includes("人工確認")),
  ).length;

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">整理工作台</p>
        <h2>第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。</h2>
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
            </button>
          ))}
        </aside>

        <div className="workbench__main">
          <RecordCard record={selectedRecord} />

          <Phase0JudgementCard
            judgement={selectedJudgement}
            record={selectedRecord}
          />
        </div>

        <aside className="workbench__checklist">
          <h3>第一階段完成檢查</h3>
          <ul>
            <li>已產生 {judgements.length} 筆安全邊界草稿</li>
            <li>{unsafeCount} 筆被標示為不可直接行動</li>
            <li>{humanReviewCount} 筆包含人工確認提示</li>
            <li>至少挑 2 個候選判斷由人類質疑或修正</li>
            <li>把資料品質問題寫進 observations</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
