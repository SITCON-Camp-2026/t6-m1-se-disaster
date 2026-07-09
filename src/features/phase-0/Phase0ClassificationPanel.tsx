import { useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import type { Phase0MessyRecord } from "./phase0-types";

const categoryLabels = ["需求", "時間", "地點", "招募"] as const;
type CategoryKey = (typeof categoryLabels)[number];

const categoryKeywords: Record<CategoryKey, string[]> = {
  需求: [
    "需要",
    "需求",
    "協助",
    "幫忙",
    "支援",
    "缺",
    "水電",
    "雨鞋",
    "鏟子",
    "藥品",
    "家具",
    "物資",
    "清泥",
    "檢修",
  ],
  時間: ["早上", "下午", "中午", "晚上", "14:20", "14:35", "16:30", "今天", "昨天", "明天"],
  地點: [
    "地址",
    "位置",
    "車站",
    "學校",
    "老街",
    "活動中心",
    "路口",
    "後方",
    "出口",
    "側門",
    "集合點",
    "附近",
    "溪畔",
    "大進",
  ],
  招募: ["招募", "志工", "集合", "派人", "過去拿", "報到", "登記", "人員", "名單"],
};

function inferCategories(record: Phase0MessyRecord): CategoryKey[] {
  const text = record.rawText.toLowerCase();

  return categoryLabels.filter((category) =>
    categoryKeywords[category].some((keyword) => text.includes(keyword.toLowerCase())),
  );
}

export function Phase0ClassificationPanel({
  records,
}: {
  records: Phase0MessyRecord[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | CategoryKey>("all");

  const recordCategories = useMemo(
    () => new Map(records.map((record) => [record.id, inferCategories(record)])),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const categories = recordCategories.get(record.id) ?? [];
      const haystack = [record.id, record.rawText]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
      const matchesCategory =
        activeCategory === "all" || categories.includes(activeCategory);

      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, recordCategories, records, searchTerm]);

  return (
    <section className="classification-panel" aria-label="分類查詢">
      <div className="panel__header">
        <div>
          <h2>分類查詢</h2>
          <p>依照需求、時間、地點與招募，把原始資訊快速縮到可確認的範圍。</p>
        </div>
        <p>
          {filteredRecords.length} / {records.length} 筆符合
        </p>
      </div>

      <div className="classification-controls">
        <label className="control-field">
          <span>搜尋</span>
          <input
            type="text"
            placeholder="搜尋關鍵字、地點或需求"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
      </div>

      <div className="category-pills" role="tablist" aria-label="分類欄位">
        <button
          type="button"
          className={activeCategory === "all" ? "active" : ""}
          onClick={() => setActiveCategory("all")}
        >
          全部
        </button>
        {categoryLabels.map((category) => (
          <button
            key={category}
            type="button"
            className={activeCategory === category ? "active" : ""}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {filteredRecords.length === 0 ? (
        <EmptyState message="沒有符合條件的資料" />
      ) : (
        <div className="grid">
          {filteredRecords.map((record) => {
            const categories = recordCategories.get(record.id) ?? [];
            return (
              <article className="record-card" key={record.id}>
                <div className="record-card__header">
                  <h3>{record.id}</h3>
                  <StatusBadge status={record.verificationStatus} />
                </div>
                <p>{record.rawText}</p>
                <div className="record-card__meta">
                  <SourceLabel sourceType={record.sourceType} />
                  <span>更新：{formatDateTime(record.updatedAt)}</span>
                </div>
                <div className="record-tags">
                  {categories.map((category) => (
                    <span className="category-chip" key={category}>
                      {category}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
