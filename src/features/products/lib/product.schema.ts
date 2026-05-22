import { z } from "zod";

export const STUDY_LEVELS = ["undergraduate", "postgraduate", "certificate", "diploma"] as const;

export const PRODUCT_STATUSES = ["published", "pending_review", "archived"] as const;

export const CURRENCIES = ["USD", "NZD", "AUD", "GBP"] as const;

export const EXAM_NAMES = [
  "IELTS",
  "TOEFL",
  "PTE",
  "CAE/C1 Advanced",
  "CPE/C2 Proficiency",
  "CAEL",
  "OET",
] as const;

export const INTAKE_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// Matches v19 `course_durations[].unit` observed values.
export const DURATION_UNITS = ["Years", "Months", "Weeks"] as const;

// v19 `course_durations[].study_mode` — optional, free-form in the payload
// but these are the only values we've seen. Kept as a suggestion set in the
// form Select; users can still type a custom value via the Edit modal's
// legacy input mapping.
export const STUDY_MODES = ["Full time", "Part time"] as const;

// v19 `course_details.available_for_international_students` — "Yes" | "No".
export const INTL_STUDENT_OPTIONS = ["Yes", "No"] as const;

/**
 * Every field is lax by design right now — only the course name is
 * required. The rest are drafts-in-progress; strict validation will
 * re-tighten once the backend surfaces a canonical required set.
 */
export const branchLocationSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
});

export const courseDurationSchema = z.object({
  id: z.string(),
  value: z.number().optional(),
  unit: z.enum(DURATION_UNITS).optional(),
  studyMode: z.string().optional(),
  studyOption: z.string().optional(),
  locations: z.string().optional(),
});

export const deliveryModeSchema = z.object({
  id: z.string(),
  deliveryMode: z.string().optional(),
  // Comma-separated list — split on save when mapping to the v19 array
  // shape `delivery_modes[].locations: string[]`. Keeping it as a single
  // string in the form keeps the row editor simple; UX can graduate to a
  // tag input later if needed.
  locations: z.string().optional(),
});

export const entryRequirementSchema = z.object({
  id: z.string(),
  examName: z.enum(EXAM_NAMES),
  overallScore: z.number().optional(),
  minimumBandScores: z
    .object({
      reading: z.number().optional(),
      writing: z.number().optional(),
      listening: z.number().optional(),
      speaking: z.number().optional(),
    })
    .optional(),
  recognized: z.boolean(),
});

export const productFormSchema = z.object({
  // Course name is the only hard requirement — everything else can save
  // as a draft while the admin is still filling in details.
  name: z.string().min(1, "Course name is required"),
  code: z.string().optional(),
  institution: z.string().optional(),
  country: z.string().optional(),
  studyAreas: z.array(z.string()),
  studyLevel: z.enum(STUDY_LEVELS).optional(),
  // v19 `course_details.course_level.qualification_type`. Free-form text
  // because the backend enum is wide (dozens of regional qualification
  // names) — a select would be more restrictive than the source data.
  qualification: z.string().optional(),
  acceptsInternational: z.enum(INTL_STUDENT_OPTIONS).optional(),
  courseDurations: z.array(courseDurationSchema),
  deliveryModes: z.array(deliveryModeSchema),
  deliveryNotes: z.string().optional(),
  fees: z.number().optional(),
  currency: z.enum(CURRENCIES).optional(),
  // `description` holds HTML emitted by the RichTextEditor. Render-side must
  // sanitize before `dangerouslySetInnerHTML` (see detail page wiring).
  description: z.string().optional(),
  branches: z.array(branchLocationSchema),
  entryRequirements: z.array(entryRequirementSchema),
  intakes: z.array(z.string()),
  status: z.enum(PRODUCT_STATUSES),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function productFormDefaults(): ProductFormValues {
  return {
    name: "",
    code: "",
    institution: "",
    country: "",
    studyAreas: [],
    studyLevel: undefined,
    qualification: "",
    acceptsInternational: undefined,
    courseDurations: [],
    deliveryModes: [],
    deliveryNotes: "",
    fees: undefined,
    currency: undefined,
    description: "",
    branches: [],
    entryRequirements: [],
    intakes: [],
    status: "pending_review",
  };
}
