// Phase 0 only. This is not the formal data contract.
export type Phase0PossibleKind =
  | "help_request_candidate"
  | "site_status_candidate"
  | "task_candidate"
  | "assignment_candidate"
  | "announcement_candidate"
  | "unknown";

export type Phase0Confidence = "low" | "medium" | "high";

export type Phase0SuggestedNextStep =
  | "keep_raw"
  | "ask_for_more_info"
  | "send_to_human_review"
  | "create_candidate_report"
  | "create_site_update_suggestion"
  | "do_not_use_yet";

export type Phase0MessyRecord = {
  id: string;
  rawText: string;
  sourceType: string;
  verificationStatus: string;
  updatedAt: string;
};

export type Phase0ReviewState = {
  humanReviewed: boolean;
  demandTags: string[];
  taskBlockerTags: string[];
};

export type Phase0ReporterRole = "本人" | "家屬代填" | "現場志工協助" | "其他";
export type Phase0UploadCategoryTag = "地點" | "需求" | "招募";
export type Phase0UploadReviewDecision = "pending" | "approved" | "rejected";

export type Phase0UploadDraftInput = {
  reporterName: string;
  role: Phase0ReporterRole;
  needSummary: string;
  locationClue: string;
  note: string;
  categoryTags: Phase0UploadCategoryTag[];
  demandTags: string[];
};

export type Phase0UploadReviewDraft = Phase0UploadDraftInput & {
  id: string;
  humanReviewed?: boolean;
  reporterCompleted?: boolean;
  reviewDecision?: Phase0UploadReviewDecision;
  demandTags?: string[];
  taskBlockerTags?: string[];
};

export type Phase0JudgementDraft = {
  messyRecordId: string;
  possibleKind: Phase0PossibleKind;
  confidence: Phase0Confidence;
  evidence: string[];
  blockers: string[];
  suggestedNextStep: Phase0SuggestedNextStep;
  unsafeToActDirectly: boolean;
  humanReviewNote?: string;
};
