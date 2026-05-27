/**
 * Product types mirror the backend's course-data-schema v19.0.0.
 *
 * Backend Zod schemas are `.loose()` — fields may be absent or null on
 * partially extracted docs. Everything nested is therefore `?:`. Use
 * optional chaining when rendering (see lib/columns.tsx, ProductCard.tsx).
 *
 * Shapes here match the v19 JSON schema exactly. Deviations have caused
 * bugs (see the `english_language_requirements` array-vs-object fiasco)
 * so when extending, cross-reference `product-portal-backend/docs/schemas/
 * course-data-schema-v19.0.0.json`.
 */

export const PRODUCT_STATUSES = ["published", "archived", "pending_review"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/**
 * The only fields the backend will sort by (per OpenAPI enum on `sortBy`).
 * Must stay in sync with
 * `product-portal-backend/src/features/products/product.schema.ts` — mismatches
 * surface as 422 Validation responses. When adding a new sort option,
 * coordinate with a backend index first.
 */
export const PRODUCT_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "course_details.course_name",
  "institution_details.institution_name",
] as const;
export type ProductSortBy = (typeof PRODUCT_SORT_FIELDS)[number];

/** Study level enum as the backend emits it (capitalized, with space). */
export const STUDY_LEVELS = [
  "Undergraduate",
  "Postgraduate",
  "Vocational Education",
  "ELICOS / English Language Course",
  "Other",
] as const;
export type StudyLevel = (typeof STUDY_LEVELS)[number];

// ---- institution_details ----

export interface InstitutionCode {
  code_type?: string;
  code_value?: string;
  address?: string | null;
}

export interface InstitutionLocation {
  full_address?: string | null;
  city?: string | null;
  state_code?: string | null;
  state_name?: string | null;
  country?: string | null;
  codes?: InstitutionCode[];
}

export interface InstitutionIdentifiers {
  codes?: InstitutionCode[];
}

export interface InstitutionDetails {
  institution_name?: string;
  institution_website?: string;
  institution_identifiers?: InstitutionIdentifiers;
  institution_locations?: InstitutionLocation[];
}

// ---- course_details ----

export interface CourseIdentifier {
  code_type?: string;
  code_value?: string;
}

export interface CourseLevel {
  study_level?: string;
  qualification_type?: string;
}

export interface CourseDuration {
  value?: number;
  unit?: string;
  study_mode?: string;
  study_option?: string | null;
  locations?: string[] | null;
}

export interface DeliveryMode {
  delivery_mode?: string;
  locations?: string[] | null;
}

export interface CourseLocation {
  campus_name?: string;
  city?: string | null;
  state_code?: string | null;
  state_name?: string | null;
  country?: string | null;
}

export interface Accreditation {
  name?: string;
}

export interface CourseDetails {
  course_name?: string;
  course_url?: string | null;
  course_overview?: string | null;
  course_major?: string[];
  course_minor?: string[];
  course_specialization?: string[];
  course_identifiers?: CourseIdentifier[];
  available_for_international_students?: "Yes" | "No" | null;
  discipline_type?: "STEM" | "Non-STEM" | null;
  study_areas?: string[];
  pgwp_alignment?: "Yes" | "No" | "Not Applicable" | null;
  course_level?: CourseLevel;
  delivery_modes?: DeliveryMode[];
  delivery_notes?: string | null;
  course_durations?: CourseDuration[];
  course_locations?: CourseLocation[];
  accreditations?: Accreditation[];
}

// ---- admissions_requirements ----

export interface ExamSpecificRequirement {
  exam_name?: string;
  requirements?: string;
}

export interface CountrySpecificRequirement {
  country_code?: string;
  country_name?: string | null;
  requirements?: string | null;
  generic_requirements?: string | null;
  exam_specific_requirements?: ExamSpecificRequirement[];
}

export interface AcademicRequirements {
  generic_requirements?: string | null;
  country_specific_requirements?: CountrySpecificRequirement[];
}

export interface IntakeEntry {
  course_start_date?: string;
  application_deadlines?: string | null;
  campus?: string | null;
  delivery_mode?: string | null;
  study_mode?: string | null;
  study_option?: string | null;
}

/**
 * Scores are free-form strings in v19 — e.g. `"6.0"`, `"67"`, `"C1"`. Keys
 * are non-canonical: IELTS uses `Overall/Listening/Reading/Writing/Speaking`,
 * CAE adds `Reading and use of English`, OET uses letter grades, etc. The UI
 * iterates `Object.entries(scores)` and renders keys verbatim.
 */
export type ExamScores = Record<string, string>;

export interface EnglishLanguageRequirement {
  test_name?: string;
  scores?: ExamScores;
}

export interface StandardizedTestRequirement {
  test_name?: string;
  scores?: ExamScores;
}

export interface AdmissionsRequirements {
  academic_requirements?: AcademicRequirements;
  foundational_pathways?: string | null;
  work_experience_requirements?: string | null;
  education_gap_requirements?: string | null;
  intakes?: IntakeEntry[];
  intake_notes?: string | null;
  english_language_requirements?: EnglishLanguageRequirement[] | null;
  standardized_test_requirements?: StandardizedTestRequirement[];
  admission_requirements_notes?: string | null;
}

// ---- fees_and_funding ----

/**
 * `amount` is a human-readable string exactly as scraped ("AU$18,400",
 * "GBP 9,250–12,000"). `value` is the numeric form for math (lower bound
 * on ranges; `0` for free). Render `amount` for display, use `value` for
 * totals or comparisons.
 */
export interface FeeEntry {
  fee_type?: string;
  amount?: string;
  currency?: string;
  value?: number;
  frequency?: string;
  description?: string | null;
  academic_year?: string | null;
  campus?: string | null;
  delivery_mode?: string | null;
  study_mode?: string | null;
  for_international_students?: "Yes" | null;
}

export interface FeesAndFunding {
  fees?: FeeEntry[];
  funding_options_url?: string | null;
  fee_notes?: string | null;
}

// ---- extraction_sources ----

export interface ExtractionSources {
  course_info?: string[];
  fee_info?: string[];
  english_requirement_info?: string[];
  academic_requirement_info?: string[];
  intake_info?: string[];
  scholarship_info?: string[];
}

// ---- Product ----

export interface Product {
  id: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  institution_details?: InstitutionDetails;
  course_details?: CourseDetails;
  admissions_requirements?: AdmissionsRequirements;
  fees_and_funding?: FeesAndFunding;
  extraction_sources?: ExtractionSources;
}

/**
 * Options returned by GET /api/v1/products/filters. The backend computes
 * distinct facet values across all (visible) products.
 */
export interface FilterOptions {
  countries: string[];
  institutions: string[];
  studyAreas: string[];
  studyLevels: string[];
  qualificationTypes: string[];
}

/**
 * Query params for GET /api/v1/products. Array filters are serialized as
 * repeated params by apiClient's paramsSerializer (`?country=AU&country=UK`).
 * `search` and `status` stay single-valued per the backend contract.
 */
export interface ProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string[];
  institution?: string[];
  studyArea?: string[];
  studyLevel?: string[];
  qualificationType?: string[];
  status?: ProductStatus;
  sortBy?: ProductSortBy;
  order?: "asc" | "desc";
  feesMin?: number;
  feesMax?: number;
  feesCurrency?: string[];
  intakeDateFrom?: string;
  intakeDateTo?: string;
  englishTest?: string;
  englishScoreMin?: number;
}

export interface ProductsPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface PaginatedProducts {
  data: Product[];
  pagination: ProductsPagination;
}

/** ISO 3166 country entry from GET /api/v1/meta/countries. */
export interface Country {
  code: string;
  name: string;
}

/**
 * Body accepted by POST /api/v1/products. Backend is `.loose()` — extra
 * nested fields are accepted and round-tripped; required leaves are just
 * `institution_details.institution_name` and `course_details.course_name`.
 *
 * Country values sent in `institution_locations[].country` must match the
 * ISO 3166 name list (see GET /api/v1/meta/countries) — 422 otherwise.
 */
export interface ProductCreateInput {
  institution_details: {
    institution_name: string;
    institution_locations?: Array<{ country?: string }>;
    [extra: string]: unknown;
  };
  course_details: {
    course_name: string;
    course_level?: {
      study_level?: string;
      qualification_type?: string;
      [extra: string]: unknown;
    };
    [extra: string]: unknown;
  };
  status?: ProductStatus;
  [extra: string]: unknown;
}
