import { useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import type {
  Phase0MessyRecord,
  Phase0ReviewState,
  Phase0UploadReviewDraft,
} from "./phase0-types";

const categoryLabels = ["需求", "地點", "招募"] as const;
type CategoryKey = (typeof categoryLabels)[number];
const inferableCategoryLabels = ["需求", "時間", "地點", "招募"] as const;
type InferableCategoryKey = (typeof inferableCategoryLabels)[number];
const timeOptions = ["早上", "中午", "晚上"] as const;
const locationOptions = [
  "車站",
  "學校",
  "老街",
  "活動中心",
  "路口",
  "溪畔",
  "大進",
] as const;

type TimeKey = (typeof timeOptions)[number];
type LocationKey = (typeof locationOptions)[number];

const categoryKeywords: Record<InferableCategoryKey, string[]> = {
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
  時間: [
    "早上",
    "下午",
    "中午",
    "晚上",
    "14:20",
    "14:35",
    "16:30",
    "今天",
    "昨天",
    "明天",
  ],
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
  招募: [
    "招募",
    "志工",
    "集合",
    "派人",
    "過去拿",
    "報到",
    "登記",
    "人員",
    "名單",
  ],
};

function inferCategoriesFromText(value: string): InferableCategoryKey[] {
  const text = value.toLowerCase();

  return inferableCategoryLabels.filter((category) =>
    categoryKeywords[category].some((keyword) =>
      text.includes(keyword.toLowerCase()),
    ),
  );
}

function inferCategories(record: Phase0MessyRecord): InferableCategoryKey[] {
  return inferCategoriesFromText(record.rawText);
}

function inferTimeSlotsFromText(text: string): TimeKey[] {
  return timeOptions.filter((slot) => text.includes(slot));
}

function inferTimeSlots(record: Phase0MessyRecord): TimeKey[] {
  return inferTimeSlotsFromText(record.rawText);
}

function inferLocationsFromText(text: string): LocationKey[] {
  return locationOptions.filter((location) => text.includes(location));
}

function inferLocations(record: Phase0MessyRecord): LocationKey[] {
  return inferLocationsFromText(record.rawText);
}

type QueryItem =
  | {
      kind: "record";
      id: string;
      text: string;
      categories: InferableCategoryKey[];
      timeSlots: TimeKey[];
      locations: LocationKey[];
      demandTags: string[];
      taskBlockerTags: string[];
      humanReviewed: boolean;
      record: Phase0MessyRecord;
    }
  | {
      kind: "upload";
      id: string;
      text: string;
      categories: InferableCategoryKey[];
      timeSlots: TimeKey[];
      locations: LocationKey[];
      demandTags: string[];
      taskBlockerTags: string[];
      humanReviewed: boolean;
      draft: Phase0UploadReviewDraft;
    };

export function Phase0ClassificationPanel({
  currentUsername,
  demandTagOptions,
  onToggleTaskAcceptance,
  records,
  reviewStates,
  taskAcceptances,
  uploadReviewDrafts,
}: {
  currentUsername: string;
  demandTagOptions: string[];
  onToggleTaskAcceptance: (taskId: string) => void;
  records: Phase0MessyRecord[];
  reviewStates: Record<string, Phase0ReviewState>;
  taskAcceptances: Record<string, string[]>;
  uploadReviewDrafts: Phase0UploadReviewDraft[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(
    [],
  );
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeKey[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<LocationKey[]>([]);
  const [selectedDemandTags, setSelectedDemandTags] = useState<string[]>([]);

  const recordCategories = useMemo(
    () =>
      new Map(records.map((record) => [record.id, inferCategories(record)])),
    [records],
  );
  const recordTimeSlots = useMemo(
    () => new Map(records.map((record) => [record.id, inferTimeSlots(record)])),
    [records],
  );
  const recordLocations = useMemo(
    () => new Map(records.map((record) => [record.id, inferLocations(record)])),
    [records],
  );

  const queryItems = useMemo<QueryItem[]>(() => {
    const recordItems: QueryItem[] = records.map((record) => {
      const reviewState = reviewStates[record.id];

      return {
        kind: "record",
        id: record.id,
        text: record.rawText,
        categories: recordCategories.get(record.id) ?? [],
        timeSlots: recordTimeSlots.get(record.id) ?? [],
        locations: recordLocations.get(record.id) ?? [],
        demandTags: reviewState?.demandTags ?? [],
        taskBlockerTags: reviewState?.taskBlockerTags ?? [],
        humanReviewed: Boolean(reviewState?.humanReviewed),
        record,
      };
    });
    const uploadItems: QueryItem[] = uploadReviewDrafts.map((draft) => {
      const textForInference = [
        draft.needSummary,
        draft.locationClue,
        draft.note,
        ...(draft.categoryTags ?? []),
        ...(draft.demandTags ?? []),
        ...(draft.taskBlockerTags ?? []),
      ].join(" ");
      const inferredCategories = inferCategoriesFromText(textForInference);
      const categories: InferableCategoryKey[] = Array.from(
        new Set([...inferredCategories, ...(draft.categoryTags ?? [])]),
      );

      return {
        kind: "upload",
        id: draft.id,
        text: draft.needSummary,
        categories,
        timeSlots: inferTimeSlotsFromText(textForInference),
        locations: inferLocationsFromText(textForInference),
        demandTags: draft.demandTags ?? [],
        taskBlockerTags: draft.taskBlockerTags ?? [],
        humanReviewed: Boolean(draft.humanReviewed),
        draft,
      };
    });

    return [...recordItems, ...uploadItems];
  }, [
    recordCategories,
    recordLocations,
    recordTimeSlots,
    records,
    reviewStates,
    uploadReviewDrafts,
  ]);

  const visibleQueryItems = useMemo(
    () => queryItems.filter((item) => item.taskBlockerTags.length === 0),
    [queryItems],
  );
  const hiddenTaskBlockedCount = queryItems.length - visibleQueryItems.length;

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return visibleQueryItems.filter((item) => {
      const reviewLabel = item.humanReviewed ? "已人工審核 人工看過" : "";
      const haystack = [
        item.id,
        item.text,
        reviewLabel,
        item.kind === "upload" ? "災民上傳 上傳草稿" : "原始資料",
        ...(item.kind === "upload"
          ? [
              item.draft.reporterName,
              item.draft.role,
              item.draft.locationClue,
              item.draft.note,
              ...(item.draft.categoryTags ?? []),
            ]
          : []),
        ...item.demandTags,
        ...item.taskBlockerTags,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((category) =>
          item.categories.includes(category),
        );
      const matchesTime =
        selectedTimeSlots.length === 0 ||
        item.timeSlots.some((slot) => selectedTimeSlots.includes(slot));
      const matchesLocation =
        selectedLocations.length === 0 ||
        item.locations.some((location) => selectedLocations.includes(location));
      const matchesDemandTags =
        selectedDemandTags.length === 0 ||
        item.demandTags.some((tag) => selectedDemandTags.includes(tag));

      return (
        matchesQuery &&
        matchesCategory &&
        matchesTime &&
        matchesLocation &&
        matchesDemandTags
      );
    });
  }, [
    searchTerm,
    selectedCategories,
    selectedDemandTags,
    selectedLocations,
    selectedTimeSlots,
    visibleQueryItems,
  ]);

  return (
    <section className="classification-panel" aria-label="分類查詢">
      <div className="panel__header">
        <div>
          <h2>分類查詢</h2>
          <p>
            依照需求、時間、地點與招募，把原始資訊快速縮到可確認的範圍；接受紀錄只存在前端暫存。
          </p>
        </div>
        <p>
          {filteredItems.length} / {visibleQueryItems.length} 筆符合
        </p>
      </div>
      {hiddenTaskBlockedCount > 0 ? (
        <p className="query-safety-note">
          已隱藏 {hiddenTaskBlockedCount} 筆不能直接變成任務的資料。
        </p>
      ) : null}

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

      <div className="category-pills" role="group" aria-label="分類欄位">
        <button
          type="button"
          className={selectedCategories.length === 0 ? "active" : ""}
          aria-pressed={selectedCategories.length === 0}
          onClick={() => setSelectedCategories([])}
        >
          全部
        </button>
        {categoryLabels.map((category) => {
          const isSelected = selectedCategories.includes(category);

          return (
            <button
              key={category}
              type="button"
              className={isSelected ? "active" : ""}
              aria-pressed={isSelected}
              onClick={() =>
                setSelectedCategories((current) =>
                  current.includes(category)
                    ? current.filter((item) => item !== category)
                    : [...current, category],
                )
              }
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="filter-group" aria-label="時間篩選">
        <div className="filter-group__title">時間</div>
        <div className="filter-pills">
          {timeOptions.map((slot) => {
            const isSelected = selectedTimeSlots.includes(slot);

            return (
              <button
                key={slot}
                type="button"
                className={isSelected ? "active" : ""}
                aria-pressed={isSelected}
                onClick={() =>
                  setSelectedTimeSlots((current) =>
                    current.includes(slot)
                      ? current.filter((item) => item !== slot)
                      : [...current, slot],
                  )
                }
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-group" aria-label="地點篩選">
        <div className="filter-group__title">地點</div>
        <div className="filter-pills">
          {locationOptions.map((location) => {
            const isSelected = selectedLocations.includes(location);

            return (
              <button
                key={location}
                type="button"
                className={isSelected ? "active" : ""}
                aria-pressed={isSelected}
                onClick={() =>
                  setSelectedLocations((current) =>
                    current.includes(location)
                      ? current.filter((item) => item !== location)
                      : [...current, location],
                  )
                }
              >
                {location}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-group" aria-label="需求分類篩選">
        <div className="filter-group__title">需求分類</div>
        <div className="filter-pills">
          {demandTagOptions.map((tag) => {
            const isSelected = selectedDemandTags.includes(tag);

            return (
              <button
                key={tag}
                type="button"
                className={isSelected ? "active" : ""}
                aria-pressed={isSelected}
                onClick={() =>
                  setSelectedDemandTags((current) =>
                    current.includes(tag)
                      ? current.filter((item) => item !== tag)
                      : [...current, tag],
                  )
                }
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState message="沒有符合條件的資料" />
      ) : (
        <div className="grid">
          {filteredItems.map((item) => {
            const acceptedUsers = taskAcceptances[item.id] ?? [];
            const isAcceptedByCurrentUser =
              acceptedUsers.includes(currentUsername);

            return (
              <article
                className={
                  item.kind === "upload"
                    ? "record-card record-card--upload"
                    : "record-card"
                }
                key={item.id}
              >
                <div className="record-card__header">
                  <h3>{item.id}</h3>
                  {item.kind === "record" ? (
                    <StatusBadge status={item.record.verificationStatus} />
                  ) : (
                    <span
                      className={
                        item.humanReviewed
                          ? "review-tag"
                          : "review-tag review-tag--blocker"
                      }
                    >
                      {item.humanReviewed ? "已人工審核" : "尚未查核"}
                    </span>
                  )}
                </div>
                <p>{item.text || "未填寫協助內容"}</p>
                <div className="record-card__meta">
                  {item.kind === "record" ? (
                    <>
                      <SourceLabel sourceType={item.record.sourceType} />
                      <span>更新：{formatDateTime(item.record.updatedAt)}</span>
                    </>
                  ) : (
                    <>
                      <span className="source-label">災民上傳</span>
                      <span>回報者：{item.draft.reporterName || "未記錄"}</span>
                      <span>地點線索：{item.draft.locationClue}</span>
                      {item.draft.note ? (
                        <span>備註：{item.draft.note}</span>
                      ) : null}
                    </>
                  )}
                </div>
                {item.humanReviewed ||
                item.demandTags.length > 0 ||
                item.taskBlockerTags.length > 0 ? (
                  <div
                    className="review-tags"
                    aria-label={`${item.id} 人工標示`}
                  >
                    {item.humanReviewed ? (
                      <span className="review-tag">已人工審核</span>
                    ) : null}
                    {item.demandTags.map((tag) => (
                      <span className="review-tag review-tag--demand" key={tag}>
                        {tag}
                      </span>
                    ))}
                    {item.taskBlockerTags.map((tag) => (
                      <span
                        className="review-tag review-tag--blocker"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="record-tags">
                  {item.categories.map((category) => (
                    <span className="category-chip" key={category}>
                      {category}
                    </span>
                  ))}
                </div>
                <div
                  className="task-acceptance"
                  aria-label={`${item.id} 接受任務`}
                >
                  <div>
                    <span className="task-acceptance__count">
                      目前 {acceptedUsers.length} 人接受
                    </span>
                    <span className="task-acceptance__note">
                      前端暫存紀錄，不代表正式派工。
                    </span>
                    <span className="task-acceptance__users">
                      接受者：
                      {acceptedUsers.length > 0
                        ? acceptedUsers.join("、")
                        : "尚無"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={isAcceptedByCurrentUser ? "active" : ""}
                    aria-pressed={isAcceptedByCurrentUser}
                    onClick={() => onToggleTaskAcceptance(item.id)}
                  >
                    {isAcceptedByCurrentUser ? "取消接受" : "接受任務"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
