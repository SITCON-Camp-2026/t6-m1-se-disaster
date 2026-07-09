# AI Log

這份紀錄用來留下小組如何使用 AI / Coding Agent 的操作脈絡。重點不是逐字保存所有對話，而是記錄重要協作、取捨與人類判斷。

## 什麼時候要記錄

請在以下情況更新本檔案：

- AI 協助分析原始資訊。
- AI 協助找出不能判斷處。
- AI 協助判斷哪些資訊不能直接相信。
- AI 協助判斷哪些資訊不能直接變成任務。
- AI 協助修改畫面標示或前端工作台。
- AI 可能補了原文沒有的資訊。
- AI 建議被小組拒絕，且拒絕原因和安全 / 正確性 / scope 有關
- AI 輸出可能造成誤導，例如把未確認資料寫成已確認事實

## 不需要記錄

- 不需要逐字貼完整對話
- 不需要記錄每一次小型 autocomplete
- 不需要記錄單純修 typo 或格式化

## 紀錄格式

| 時間       | 階段    | 任務                         | AI / Agent 建議                                                                                                    | 採用 / 拒絕 | 人類判斷理由                                                                     | 相關檔案 / commit                                                                                                                               |
| ---------- | ------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-09 | Phase 0 | 建立分類查詢與篩選介面       | 建議在首頁加入可搜尋、可依來源與狀態篩選的整理面板                                                                 | 採用        | 這能讓學員快速查看原始資訊的分布與可疑點，且符合 Phase 0 的最小工作台需求        | `src/app/App.tsx`, `src/features/phase-0/Phase0ClassificationPanel.tsx`, `tests/app-smoke.test.tsx`                                             |
| 2026-07-09 | Phase 0 | 新增人工審核與需求分類       | 建議用前端暫存狀態讓工作人員標示「已人工審核」與「須自備工具」，並同步顯示在查詢頁                                 | 採用        | 這是人工整理狀態，不改原始 fixture，也不把未確認資訊改成 verified / confirmed    | `src/app/App.tsx`, `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0ClassificationPanel.tsx`, `tests/app-smoke.test.tsx` |
| 2026-07-09 | Phase 0 | 擴充需求分類標籤             | 建議把需求分類選項集中管理，新增「不須自備工具」與「需要物資」，讓工作人員頁與查詢頁共用                           | 採用        | 這些仍是人工標示，不代表資料已確認，也不改動 Phase 0 原始資訊                    | `src/app/App.tsx`, `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0ClassificationPanel.tsx`, `tests/app-smoke.test.tsx` |
| 2026-07-09 | Phase 0 | 新增不能直接變成任務原因     | 建議讓工作人員用人工標籤標出地點不清楚、時間不明、來源未確認、非當事人轉述、可能有安全風險，並讓查詢頁可搜尋與篩選 | 採用        | 這能凸顯資料品質問題；標籤只是人工檢查線索，不是正式派工判斷                     | `src/app/App.tsx`, `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0ClassificationPanel.tsx`, `tests/app-smoke.test.tsx` |
| 2026-07-09 | Phase 0 | 新增災民上傳資料頁面         | 建議新增前端-only 模擬表單，讓回報者建立待人工確認草稿與補充檔名預覽                                               | 採用        | 不呼叫 API、不儲存檔案、不加入正式資料；草稿只用來展示原始資訊進入前需要人工確認 | `src/app/App.tsx`, `src/features/phase-0/Phase0UploadPage.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`                             |
| 2026-07-09 | Phase 0 | 串接上傳草稿人工查核         | 建議將地點線索改成按鈕選項，並讓上傳草稿送交後自動切到工作人員頁的待查核清單                                       | 採用        | 減少真實地址輸入風險；送交人工查核仍是前端暫存流程，不代表正式收案或已確認       | `src/app/App.tsx`, `src/features/phase-0/Phase0UploadPage.tsx`, `src/features/phase-0/Phase0Workbench.tsx`, `tests/app-smoke.test.tsx`          |
| 2026-07-09 | Phase 0 | 改善上傳草稿工作人員處理     | 建議把上傳草稿併入工作人員資料清單，用顏色區分來源，並提供 session 暫存與刪除功能                                  | 採用        | 仍是本機前端暫存，不改 Phase 0 原始 fixture；刪除只移除人工查核佇列中的草稿      | `src/app/App.tsx`, `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`                              |
| 2026-07-09 | Phase 0 | 修正工作人員頁 UI 與上傳審核 | 建議收斂工作人員頁為兩欄版面，並讓 `U-xxx` 上傳草稿可標為已人工審核後再刪除                                        | 採用        | 審核狀態只代表人工看過，不把上傳草稿轉成 verified，也不寫入正式資料              | `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`                                                 |
| 2026-07-09 | Phase 0 | 讓審核後上傳資料可查詢       | 建議讓 `U-xxx` 上傳草稿也能加需求分類與不能直接變成任務原因，並只在人工審核後顯示於查詢頁                          | 採用        | 讓其他人可在查詢頁看到人工整理結果，但仍保留待確認語意，不把上傳內容標成已確認   | `src/app/App.tsx`, `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0ClassificationPanel.tsx`, `tests/app-smoke.test.tsx` |

## 範例

| 時間  | 階段    | 任務         | AI / Agent 建議                        | 採用 / 拒絕 | 人類判斷理由                              | 相關檔案 / commit             |
| ----- | ------- | ------------ | -------------------------------------- | ----------- | ----------------------------------------- | ----------------------------- |
| 09:45 | Phase 0 | 分析原始資訊 | 建議把社群貼文直接轉成 verified report | 拒絕        | 社群貼文來源未確認，應保持 `needs_review` | `docs/phase0-observations.md` |

## 課後反思

### AI 幫助最大的地方

-

### AI 最容易誤導的地方

-

### 下次使用 AI 開發前，我們會先準備

-
