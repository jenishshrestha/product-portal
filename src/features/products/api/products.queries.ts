/**
 * Per-feature query key factory for products. Replaces `queryKeys.products.*`
 * from `@shared/lib/query/client` (which is deprecated — see
 * docs/data-access-layer.md). Keys co-locate with the feature so downstream
 * additions (scholarships, revisions, etc.) can extend this file without
 * touching shared config.
 *
 * `list(filters)` takes the params object structurally — TanStack Query hashes
 * it with sorted keys so `{page:1, limit:10}` and `{limit:10, page:1}` share
 * a cache entry.
 */
export const productsKeys = {
  all: ["products"] as const,
  lists: () => [...productsKeys.all, "list"] as const,
  list: (filters: unknown) => [...productsKeys.lists(), { filters }] as const,
  details: () => [...productsKeys.all, "detail"] as const,
  detail: (id: string) => [...productsKeys.details(), id] as const,
  filters: () => [...productsKeys.all, "filters"] as const,
  /**
   * Stat-strip counts live under their own namespace (not nested inside
   * `lists()`) so a mutation can patch list caches in-place without
   * incidentally refetching them, while still forcing the counts to
   * refresh. See `useUpdateProduct` / bulk mutation handlers.
   */
  counts: () => [...productsKeys.all, "counts"] as const,
};
