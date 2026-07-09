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

const categoryLabels = ["需求", "時間", "地點", "招募"] as const;
type CategoryKey = (typeof categoryLabels)[number];
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

function inferCategoriesFromText(value: string): CategoryKey[] {
  const text = value.toLowerCase();

  return categoryLabels.filter((category) =>
    categoryKeywords[category].some((keyword) =>
      text.includes(keyword.toLowerCase()),
    ),
  );
}

function inferCategories(record: Phase0MessyRecord): CategoryKey[] {
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
      categories: CategoryKey[];
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
      categories: CategoryKey[];
      timeSlots: TimeKey[];
      locations: LocationKey[];
      demandTags: string[];
      taskBlockerTags: string[];
      humanReviewed: boolean;
      draft: Phase0UploadReviewDraft;
    };

export function Phase0ClassificationPanel({
  demandTagOptions,
  records,
  reviewStates,
  taskBlockerTagOptions,
  uploadReviewDrafts,
}: {
  demandTagOptions: string[];
  records: Phase0MessyRecord[];
  reviewStates: Record<string, Phase0ReviewState>;
  taskBlockerTagOptions: string[];
  uploadReviewDrafts: Phase0UploadReviewDraft[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(
    [],
  );
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeKey[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<LocationKey[]>([]);
  const [selectedDemandTags, setSelectedDemandTags] = useState<string[]>([]);
  const [selectedTaskBlockerTags, setSelectedTaskBlockerTags] = useState<
    string[]
  >([]);

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
    const uploadItems: QueryItem[] = uploadReviewDrafts
      .filter((draft) => draft.humanReviewed)
      .map((draft) => {
        const textForInference = [
          draft.needSummary,
          draft.locationClue,
          ...(draft.demandTags ?? []),
          ...(draft.taskBlockerTags ?? []),
        ].join(" ");

        return {
          kind: "upload",
          id: draft.id,
          text: draft.needSummary,
          categories: inferCategoriesFromText(textForInference),
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

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return queryItems.filter((item) => {
      const reviewLabel = item.humanReviewed ? "已人工審核 人工看過" : "";
      const haystack = [
        item.id,
        item.text,
        reviewLabel,
        item.kind === "upload" ? "災民上傳 上傳草稿" : "原始資料",
        ...(item.kind === "upload"
          ? [
              item.draft.role,
              item.draft.locationClue,
              ...item.draft.uploadedFileNames,
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
        item.categories.some((category) =>
          selectedCategories.includes(category),
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
      const matchesTaskBlockerTags =
        selectedTaskBlockerTags.length === 0 ||
        item.taskBlockerTags.some((tag) =>
          selectedTaskBlockerTags.includes(tag),
        );

      return (
        matchesQuery &&
        matchesCategory &&
        matchesTime &&
        matchesLocation &&
        matchesDemandTags &&
        matchesTaskBlockerTags
      );
    });
  }, [
    queryItems,
    searchTerm,
    selectedCategories,
    selectedDemandTags,
    selectedLocations,
    selectedTaskBlockerTags,
    selectedTimeSlots,
  ]);

  return (
    <section className="classification-panel" aria-label="分類查詢">
      <div className="panel__header">
        <div>
          <h2>分類查詢</h2>
          <p>依照需求、時間、地點與招募，把原始資訊快速縮到可確認的範圍。</p>
        </div>
        <p>
          {filteredItems.length} / {queryItems.length} 筆符合
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

      <div className="filter-group" aria-label="不能直接變成任務原因篩選">
        <div className="filter-group__title">不能直接變成任務</div>
        <div className="filter-pills">
          {taskBlockerTagOptions.map((tag) => {
            const isSelected = selectedTaskBlockerTags.includes(tag);

            return (
              <button
                key={tag}
                type="button"
                className={isSelected ? "active" : ""}
                aria-pressed={isSelected}
                onClick={() =>
                  setSelectedTaskBlockerTags((current) =>
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
                    <span className="review-tag">已人工審核</span>
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
                      <span>地點線索：{item.draft.locationClue}</span>
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
                    {item.kind === "record" && item.humanReviewed ? (
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
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
