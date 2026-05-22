import { BackLink } from "@shared/components/BackLink";

/**
 * Product-specific back link — wraps the shared `BackLink` with the
 * destination + label pinned to the products listing.
 */
export function ProductDetailBackLink() {
  return <BackLink to="/products">Back to courses</BackLink>;
}
