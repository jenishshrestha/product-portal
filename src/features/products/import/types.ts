/** Per-row outcome of a successful import. Indices are remapped to file-global. */
export interface SucceededRow {
  index: number;
  id: string;
  action: "inserted" | "updated";
}

/** Per-row failure with the original record + error envelope. */
export interface FailedRow {
  index: number;
  /** The original record from the user's file — handed back so the
   *  results UI can display key fields and the user can copy/fix it. */
  record: unknown;
  error: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

/** Live import state. Both arrays accumulate across batches. */
export interface ImportProgress {
  totalRecords: number;
  totalBatches: number;
  batchesCompleted: number;
  succeeded: SucceededRow[];
  failed: FailedRow[];
}

/** What we render in the preview table — pulled from v19 docs. */
export interface PreviewRow {
  index: number;
  institution: string;
  course: string;
  qualification: string;
  studyLevel: string;
  duration: string;
  country: string;
  tuition: string;
}

/** Wizard step machine. */
export type WizardState =
  | { kind: "idle" }
  | {
      kind: "parsed";
      file: { name: string; size: number };
      records: unknown[];
      preview: PreviewRow[];
    }
  | {
      kind: "importing";
      file: { name: string; size: number };
      records: unknown[];
      progress: ImportProgress;
    }
  | {
      kind: "done";
      file: { name: string; size: number };
      records: unknown[];
      progress: ImportProgress;
    };
