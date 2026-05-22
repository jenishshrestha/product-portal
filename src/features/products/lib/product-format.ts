import type { EnglishLanguageRequirement, Product, ProductStatus } from "../types/product.types";

const EMPTY = "—";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Labels for the flat starter study-level enum (lowercase). The v19 backend
 * uses capitalized values ("Postgraduate"); these labels exist for the
 * restored legacy form's Select component, which operates on the flat enum.
 */
export const STUDY_LEVEL_LABELS: Record<string, string> = {
  undergraduate: "Undergraduate",
  postgraduate: "Postgraduate",
  certificate: "Certificate",
  diploma: "Diploma",
};

export const STATUS_LABELS: Record<ProductStatus, string> = {
  published: "Active",
  archived: "Disabled",
  pending_review: "Pending Review",
};

export const STATUS_BADGE_VARIANT: Record<
  ProductStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  published: "default",
  archived: "outline",
  pending_review: "secondary",
};

/**
 * Format a v19 partial date ("YYYY-MM" or "YYYY-MM-DD") to a user-facing
 * label ("Feb 2026" / "Feb 27, 2026"). Returns `undefined` for unparseable
 * inputs — callers can decide whether to fall back to the raw string.
 */
export function formatPartialDate(raw: string | null | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }
  const parts = raw.split("-");
  if (parts.length < 2) {
    return undefined;
  }
  const yearStr = parts[0];
  const monthStr = parts[1];
  const dayStr = parts[2];
  const monthIdx = Number.parseInt(monthStr ?? "", 10) - 1;
  if (Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) {
    return undefined;
  }
  const monthName = MONTH_NAMES[monthIdx];
  if (dayStr) {
    const day = Number.parseInt(dayStr, 10);
    if (!Number.isNaN(day)) {
      return `${monthName} ${day}, ${yearStr}`;
    }
  }
  return `${monthName} ${yearStr}`;
}

export function primaryCourseName(product: Product): string {
  return product.course_details?.course_name ?? EMPTY;
}

/**
 * First `course_identifier` code value, if present. Backend v19 stores these
 * in `course_details.course_identifiers[]` as `{ code_type, code_value }`.
 * Returns `undefined` when missing so callers can skip rendering the code.
 */
export function primaryCourseCode(product: Product): string | undefined {
  const identifiers = product.course_details?.course_identifiers;
  if (!identifiers?.length) {
    return undefined;
  }
  const first = identifiers[0];
  const value = first?.code_value;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function primaryInstitution(product: Product): string {
  return product.institution_details?.institution_name ?? EMPTY;
}

export function primaryCountry(product: Product): string {
  return product.institution_details?.institution_locations?.[0]?.country ?? EMPTY;
}

export function primaryStudyArea(product: Product): string {
  return product.course_details?.study_areas?.[0] ?? EMPTY;
}

export function primaryStudyLevel(product: Product): string {
  return product.course_details?.course_level?.study_level ?? EMPTY;
}

export function primaryQualification(product: Product): string {
  return product.course_details?.course_level?.qualification_type ?? EMPTY;
}

export function primaryDuration(product: Product): string {
  const d = product.course_details?.course_durations?.[0];
  if (!d?.value || !d?.unit) {
    return EMPTY;
  }
  // Units come capitalized from the backend ("Years", "Months"); force
  // lowercase so the cell reads "2 years" like the Claude Design catalog.
  const unit = d.unit.toLowerCase();
  return `${d.value} ${unit}`;
}

/** Study mode ("Full time", "Part time") paired with primaryDuration. */
export function primaryDurationMode(product: Product): string | undefined {
  return product.course_details?.course_durations?.[0]?.study_mode ?? undefined;
}

/**
 * Joined delivery modes, e.g. "On campus, Hybrid". Reads from
 * `course_details.delivery_modes[].delivery_mode`; returns `undefined`
 * when the backend doesn't have the field populated.
 */
export function primaryDeliveryModes(product: Product): string | undefined {
  const modes = product.course_details?.delivery_modes;
  if (!modes?.length) {
    return undefined;
  }
  const labels = modes
    .map((mode) => mode?.delivery_mode)
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  return labels.length > 0 ? labels.join(", ") : undefined;
}

/**
 * First intake's formatted start date ("Feb 2026"). Reads the v19 partial
 * date from `intakes[].course_start_date`. Returns `undefined` when no
 * intakes exist or the first date is unparseable.
 */
export function nextIntake(product: Product): string | undefined {
  const intakes = product.admissions_requirements?.intakes;
  if (!intakes?.length) {
    return undefined;
  }
  const first = intakes[0];
  if (!first?.course_start_date) {
    return undefined;
  }
  return formatPartialDate(first.course_start_date) ?? first.course_start_date;
}

export function primaryCity(product: Product): string | undefined {
  const loc = product.institution_details?.institution_locations?.[0];
  if (!loc) {
    return undefined;
  }
  if (loc.city && loc.state_code) {
    return `${loc.city} ${loc.state_code}`;
  }
  return loc.city ?? undefined;
}

/**
 * "City STATE" — e.g. "Melbourne VIC". Falls back to city alone, then the
 * country, then EMPTY.
 */
export function primaryLocation(product: Product): string {
  const loc = product.institution_details?.institution_locations?.[0];
  if (!loc) {
    return EMPTY;
  }
  if (loc.city && loc.state_code) {
    return `${loc.city} ${loc.state_code}`;
  }
  return loc.city ?? loc.state_name ?? loc.country ?? EMPTY;
}

/**
 * First fee's display string — uses the scraped `amount` verbatim ("AU$18,400")
 * because it's already human-formatted. Falls back to synthesising from
 * `value` + `currency` when `amount` is missing but `value` is present.
 */
export function primaryFee(product: Product): string {
  const fee = product.fees_and_funding?.fees?.[0];
  if (!fee) {
    return EMPTY;
  }
  if (fee.amount) {
    return fee.amount;
  }
  if (typeof fee.value === "number" && fee.currency) {
    return `${fee.value.toLocaleString()} ${fee.currency}`;
  }
  return EMPTY;
}

/**
 * Tuition split into amount + currency so the table can render the amount
 * bold and the currency code small & muted (matches design's `.tuition` +
 * `.curr` styling). Prefers `value` + `currency` for clean rendering;
 * falls back to the raw `amount` string when `value` is missing.
 */
export function primaryTuition(product: Product): { amount: string; currency: string } | undefined {
  const fee = product.fees_and_funding?.fees?.[0];
  if (!fee) {
    return undefined;
  }
  if (typeof fee.value === "number") {
    return {
      amount: `$${fee.value.toLocaleString()}`,
      currency: fee.currency ?? "",
    };
  }
  if (fee.amount) {
    return { amount: fee.amount, currency: fee.currency ?? "" };
  }
  return undefined;
}

/**
 * Exams present on the product. Iterates `english_language_requirements` as
 * an ARRAY of `{ test_name, scores }` — NOT an object keyed by exam name,
 * which is a subtle v19 gotcha that previously caused tabs to render as
 * `0, 1, 2, 3` instead of exam names. Case-insensitive dedupe keeps the
 * first occurrence of each exam name.
 */
export function englishExamScores(product: Product): EnglishLanguageRequirement[] {
  const reqs = product.admissions_requirements?.english_language_requirements;
  if (!Array.isArray(reqs) || reqs.length === 0) {
    return [];
  }
  const seen = new Map<string, EnglishLanguageRequirement>();
  for (const exam of reqs) {
    if (!exam?.test_name) {
      continue;
    }
    const key = exam.test_name.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, exam);
    }
  }
  return Array.from(seen.values());
}

/**
 * Coerce anything to a well-typed array. Works around v19's `.loose()`
 * schema — a field declared as `T[]` can legitimately be `null`, missing,
 * or (in a handful of early docs) a scalar / object / malformed value.
 * Callers get a safe `.map`-able array in all cases instead of a crash.
 */
export function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Best-effort "· "-joined label for a v19 `locations` field. v19 declares
 * `delivery_modes[].locations` / `course_durations[].locations` as
 * `string[] | null`, but the loose upstream pipeline occasionally emits
 * array-of-objects (`{ campus_name, city, ... }`) or a single string. This
 * helper handles all three so a renderer never needs to call `.join` on
 * something that isn't an array. Returns `undefined` when no meaningful
 * value can be extracted.
 */
export function formatLocations(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }
  const labels: string[] = [];
  for (const entry of value) {
    if (typeof entry === "string" && entry.length > 0) {
      labels.push(entry);
      continue;
    }
    if (entry && typeof entry === "object") {
      const obj = entry as { campus_name?: unknown; city?: unknown; name?: unknown };
      const label =
        (typeof obj.campus_name === "string" && obj.campus_name) ||
        (typeof obj.name === "string" && obj.name) ||
        (typeof obj.city === "string" && obj.city) ||
        undefined;
      if (label) {
        labels.push(label);
      }
    }
  }
  return labels.length > 0 ? labels.join(" · ") : undefined;
}

/**
 * Flatten `course_details.course_identifiers[]` into a map keyed by
 * `code_type` for the detail page's Course Codes card. Later entries with
 * the same type win — matches the design's assumption of unique-per-type
 * codes (CRICOS / CIP / NZQCF).
 */
export function courseIdentifiersByType(product: Product): Record<string, string> {
  const identifiers = product.course_details?.course_identifiers;
  if (!identifiers?.length) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const id of identifiers) {
    if (id?.code_type && id?.code_value) {
      out[id.code_type] = id.code_value;
    }
  }
  return out;
}

/**
 * "2d ago", "6h ago", "11m ago" — compact relative time matching the
 * design's updated column. Uses absolute-time delta, not `Intl.RelativeTime`
 * (which emits verbose strings like "2 days ago").
 */
export function updatedAgo(product: Product): string {
  const raw = product.updatedAt;
  if (!raw) {
    return EMPTY;
  }
  const then = Date.parse(raw);
  if (Number.isNaN(then)) {
    return EMPTY;
  }
  const ms = Date.now() - then;
  if (ms < 0) {
    return "just now";
  }
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return "just now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `${weeks}w ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
