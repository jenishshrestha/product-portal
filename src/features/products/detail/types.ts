/**
 * Detail-sub-feature-owned types. Kept in the feature (not in the route
 * file) so the feature can be imported without reaching into `app/routes/`.
 * The route imports FROM here, not the other way around.
 */

export const PRODUCT_DETAIL_TABS = ["overview", "admissions", "fees"] as const;
export type ProductDetailTab = (typeof PRODUCT_DETAIL_TABS)[number];
