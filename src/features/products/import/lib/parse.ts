import {
  primaryCountry,
  primaryCourseName,
  primaryDuration,
  primaryInstitution,
  primaryQualification,
  primaryStudyLevel,
  primaryTuition,
} from "../../lib/product-format";
import type { Product } from "../../types/product.types";
import type { PreviewRow } from "../types";

/**
 * Validates that a parsed JSON file looks like a v19 product array. We
 * intentionally don't mirror the full v19 schema here — the backend
 * authoritative-validates and returns per-row errors. We only check the
 * minimum shape needed to render the preview without crashing.
 */
export class ImportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportParseError";
  }
}

export interface ParseResult {
  records: unknown[];
  preview: PreviewRow[];
}

const MAX_PREVIEW_ROWS = 5;

export function parseImportFile(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Invalid JSON";
    throw new ImportParseError(`Couldn't parse the file as JSON: ${detail}`);
  }

  // Accept either a bare top-level array (`[{...}, ...]`) or the export
  // envelope (`{ "products": [...] }`) so a file produced by
  // GET /products/export?format=json can be re-imported as-is.
  const records = unwrapRecords(parsed);

  if (records.length === 0) {
    throw new ImportParseError("The file is empty — no records to import.");
  }

  // Loose shape check: each record must be an object. Deeper validation
  // is the backend's job; we want to surface obvious file-level mistakes.
  const firstBad = records.findIndex(
    (r) => r === null || typeof r !== "object" || Array.isArray(r),
  );
  if (firstBad !== -1) {
    throw new ImportParseError(
      `Row ${firstBad + 1} isn't a product object. Every entry must be an object.`,
    );
  }

  return {
    records,
    preview: records.slice(0, MAX_PREVIEW_ROWS).map(toPreviewRow),
  };
}

function unwrapRecords(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object" && "products" in parsed) {
    const inner = (parsed as { products: unknown }).products;
    if (Array.isArray(inner)) return inner;
  }
  throw new ImportParseError(
    "Expected a JSON array of product records, or an object like { products: [...] }.",
  );
}

/**
 * Best-effort projection of a v19 record into the preview shape. Casts to
 * `Product` so we can reuse the listing-page formatters; any missing field
 * resolves to "—" via the helpers' fallbacks, so a partial/malformed record
 * still renders without crashing.
 */
function toPreviewRow(record: unknown, idx: number): PreviewRow {
  const product = (record ?? {}) as Product;
  const tuition = primaryTuition(product);
  return {
    index: idx,
    institution: primaryInstitution(product),
    course: primaryCourseName(product),
    qualification: primaryQualification(product),
    studyLevel: primaryStudyLevel(product),
    duration: primaryDuration(product),
    country: primaryCountry(product),
    tuition: tuition ? `${tuition.amount} ${tuition.currency}`.trim() : "—",
  };
}
