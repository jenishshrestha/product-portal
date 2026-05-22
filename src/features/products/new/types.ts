/**
 * New-course-sub-feature-owned tab identifiers. Matches the three-tab shape
 * of the detail page so the form layout reads like a live-preview of the
 * record it'll create.
 */

export const PRODUCT_NEW_TABS = ["overview", "admissions", "fees"] as const;
export type ProductNewTab = (typeof PRODUCT_NEW_TABS)[number];
