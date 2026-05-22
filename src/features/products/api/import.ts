/**
 * Bulk-import service. Auto-chunks the user's file into 500-record batches
 * (the backend hard-caps a single call at 500), POSTs them sequentially,
 * and emits per-batch progress so the UI can show a live counter.
 *
 * Indices in batch responses are batch-local; we remap them to file-global
 * so the results UI can say "Row 1247 failed" without the user having to
 * mentally translate "batch 3 row 47."
 *
 * Endpoint contract: docs/backend-integration.md (Bulk Import section).
 */

import { apiFetch, unwrap } from "@shared/lib/dal";
import type { FailedRow, ImportProgress, SucceededRow } from "../import/types";

/** Backend per-call limit. Keep in sync with `/products/bulk-import` schema. */
export const IMPORT_BATCH_SIZE = 500;

interface BulkImportRequest {
  products: unknown[];
}

interface BatchResponseSucceeded {
  index: number;
  id: string;
  action: "inserted" | "updated";
}

interface BatchResponseFailed {
  index: number;
  error: { code?: string; message?: string; details?: unknown };
}

interface BatchResponse {
  data: {
    succeeded: BatchResponseSucceeded[];
    failed: BatchResponseFailed[];
  };
}

/**
 * Imports `records` in batches of {@link IMPORT_BATCH_SIZE}. `onProgress`
 * is called once after each batch completes with the *cumulative* state.
 *
 * Returns the final accumulated progress on resolve. Throws on transport
 * errors (the entire import aborts) — per-record errors come back through
 * `progress.failed` and never throw.
 */
export async function bulkImportProducts(
  records: unknown[],
  onProgress: (progress: ImportProgress) => void,
): Promise<ImportProgress> {
  const batches = chunk(records, IMPORT_BATCH_SIZE);
  const progress: ImportProgress = {
    totalRecords: records.length,
    totalBatches: batches.length,
    batchesCompleted: 0,
    succeeded: [],
    failed: [],
  };

  let offset = 0;
  for (const batch of batches) {
    const response = await unwrap(
      apiFetch<BatchResponse, BulkImportRequest>(
        { key: "products.bulkImport", path: "/api/v1/products/bulk-import", method: "POST" },
        { body: { products: batch } },
      ),
    );

    progress.succeeded.push(...mapSucceeded(response.data.succeeded, offset));
    progress.failed.push(...mapFailed(response.data.failed, batch, offset));
    progress.batchesCompleted += 1;
    onProgress({ ...progress });

    offset += batch.length;
  }

  return progress;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error("chunk size must be > 0");
  }
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function mapSucceeded(rows: BatchResponseSucceeded[], offset: number): SucceededRow[] {
  return rows.map((r) => ({
    index: r.index + offset,
    id: r.id,
    action: r.action,
  }));
}

function mapFailed(rows: BatchResponseFailed[], batch: unknown[], offset: number): FailedRow[] {
  return rows.map((r) => ({
    index: r.index + offset,
    record: batch[r.index],
    error: {
      code: r.error.code,
      message: r.error.message ?? "Validation failed",
      details: r.error.details,
    },
  }));
}
