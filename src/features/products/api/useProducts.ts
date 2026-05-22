import type { DataTableServerResponse } from "@shared/lib/data-table";
import {
  type QueryClient,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type {
  PaginatedProducts,
  Product,
  ProductCreateInput,
  ProductStatus,
  ProductsParams,
} from "../types/product.types";
import { getCountries } from "./meta.service";
import { productsKeys } from "./products.queries";
import {
  createProduct,
  deleteProduct,
  getFilterOptions,
  getProduct,
  getProducts,
  updateProduct,
} from "./products.service";

export function useProducts(params: ProductsParams = {}) {
  return useQuery({
    queryKey: productsKeys.list(params),
    queryFn: () => getProducts(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productsKeys.detail(id),
    queryFn: () => getProduct(id),
    enabled: id.length > 0,
  });
}

/**
 * Suspense version of `useProduct`. Used by the detail page which has a
 * route-level `ensureQueryData` loader — cache is warm by the time the
 * component mounts, so `data` is guaranteed non-nullable. Error boundary
 * on the route catches network failures.
 */
export function useSuspenseProduct(id: string) {
  return useSuspenseQuery({
    queryKey: productsKeys.detail(id),
    queryFn: () => getProduct(id),
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: productsKeys.filters(),
    queryFn: getFilterOptions,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * ISO 3166 country list for product create/edit. Backend doesn't change this
 * per-session so cache aggressively.
 */
export function useCountries() {
  return useQuery({
    queryKey: ["meta", "countries"] as const,
    queryFn: getCountries,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/**
 * Per-status count breakdown for the page-header stats strip. Each status
 * fires a dedicated request with `limit: 1` so the only meaningful payload
 * is `pagination.totalResults`. Cheap per query, but 4 round-trips per
 * page load — backend is on the hook to ship a `/products/stats` aggregate
 * (see docs/backend-integration.md).
 *
 * TODO(backend): collapse into a single `GET /api/v1/products/stats` call
 * once the endpoint ships. Track in the backend integration plan.
 */
const COUNT_STATUSES: readonly ProductStatus[] = ["published", "pending_review", "archived"];

export function useProductCounts() {
  const results = useQueries({
    queries: [
      {
        queryKey: [...productsKeys.counts(), "total"] as const,
        queryFn: () => getProducts({ limit: 1 }).then((r) => r.pagination.totalResults),
        staleTime: 60_000,
      },
      ...COUNT_STATUSES.map((status) => ({
        queryKey: [...productsKeys.counts(), status] as const,
        queryFn: () => getProducts({ limit: 1, status }).then((r) => r.pagination.totalResults),
        staleTime: 60_000,
      })),
    ],
  });

  const [total, published, pendingReview, archived] = results;
  return {
    total: total?.data ?? 0,
    published: published?.data ?? 0,
    pendingReview: pendingReview?.data ?? 0,
    archived: archived?.data ?? 0,
    isLoading: results.some((r) => r.isLoading),
  };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductCreateInput) => createProduct(body),
    onSuccess: () => {
      // Creates can land on any page under any sort order, so cache
      // surgery isn't worth the guesswork — just refetch lists fully.
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productsKeys.filters() });
      queryClient.invalidateQueries({ queryKey: productsKeys.counts() });
    },
  });
}

/**
 * Both list cache shapes (`DataTableServerResponse<Product>` from the
 * DataTable and `PaginatedProducts` from `useProducts`) wrap `Product[]`
 * under `.data`, so this type covers both. The pagination fields differ
 * (`total` vs `pagination.totalResults`) — helpers handle each explicitly
 * when they need to adjust counts.
 */
type AnyProductListCache = DataTableServerResponse<Product> | PaginatedProducts;

/**
 * Replace a single product inside every cached products list. Skips caches
 * that don't contain the id so we only trigger re-renders where needed.
 */
function patchProductInListCaches(queryClient: QueryClient, product: Product): void {
  queryClient.setQueriesData<AnyProductListCache | undefined>(
    { queryKey: productsKeys.lists() },
    (prev) => {
      if (!prev || !Array.isArray(prev.data)) {
        return prev;
      }
      const idx = prev.data.findIndex((p) => p.id === product.id);
      if (idx < 0) {
        return prev;
      }
      const nextData = prev.data.slice();
      nextData[idx] = product;
      return { ...prev, data: nextData };
    },
  );
}

/**
 * Bulk variant: sets `status` on every product whose id is in `ids`, across
 * both list caches and any warmed detail caches. Caches without any matching
 * id are left untouched so untouched pages don't re-render.
 */
function patchStatusInCaches(
  queryClient: QueryClient,
  ids: readonly string[],
  status: ProductStatus,
): void {
  if (ids.length === 0) {
    return;
  }
  const idSet = new Set(ids);
  queryClient.setQueriesData<AnyProductListCache | undefined>(
    { queryKey: productsKeys.lists() },
    (prev) => {
      if (!prev || !Array.isArray(prev.data)) {
        return prev;
      }
      if (!prev.data.some((p) => idSet.has(p.id))) {
        return prev;
      }
      const nextData = prev.data.map((p) => (idSet.has(p.id) ? { ...p, status } : p));
      return { ...prev, data: nextData };
    },
  );
  for (const id of ids) {
    queryClient.setQueryData<Product | undefined>(productsKeys.detail(id), (prev) =>
      prev ? { ...prev, status } : prev,
    );
  }
}

/**
 * Bulk-delete variant: strips `ids` from every list cache and decrements
 * whichever total field that cache carries. Detail caches for removed ids
 * are invalidated so any lingering detail view refetches (or 404s).
 */
function removeFromCaches(queryClient: QueryClient, ids: readonly string[]): void {
  if (ids.length === 0) {
    return;
  }
  const idSet = new Set(ids);
  queryClient.setQueriesData<AnyProductListCache | undefined>(
    { queryKey: productsKeys.lists() },
    (prev) => {
      if (!prev || !Array.isArray(prev.data)) {
        return prev;
      }
      const nextData = prev.data.filter((p) => !idSet.has(p.id));
      if (nextData.length === prev.data.length) {
        return prev;
      }
      const removed = prev.data.length - nextData.length;
      if ("total" in prev && typeof prev.total === "number") {
        return { ...prev, data: nextData, total: Math.max(0, prev.total - removed) };
      }
      if ("pagination" in prev) {
        return {
          ...prev,
          data: nextData,
          pagination: {
            ...prev.pagination,
            totalResults: Math.max(0, prev.pagination.totalResults - removed),
          },
        };
      }
      return { ...prev, data: nextData };
    },
  );
  for (const id of ids) {
    queryClient.invalidateQueries({
      queryKey: productsKeys.detail(id),
      refetchType: "none",
    });
  }
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ProductCreateInput> }) =>
      updateProduct(id, body),
    onSuccess: (product, { id }) => {
      // Surgical cache update — avoids a full list refetch, which combined
      // with `getRowId` means only the edited row re-renders. Filters can
      // drift (e.g. status change may move a row out of the current filter);
      // marking the list queries stale with `refetchType: 'none'` lets the
      // next navigation / remount refresh without forcing a refetch now.
      patchProductInListCaches(queryClient, product);
      queryClient.setQueryData(productsKeys.detail(id), product);
      queryClient.invalidateQueries({
        queryKey: productsKeys.lists(),
        refetchType: "none",
      });
      queryClient.invalidateQueries({ queryKey: productsKeys.filters() });
      queryClient.invalidateQueries({ queryKey: productsKeys.counts() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: (_, id) => {
      removeFromCaches(queryClient, [id]);
      queryClient.invalidateQueries({
        queryKey: productsKeys.lists(),
        refetchType: "none",
      });
      queryClient.invalidateQueries({ queryKey: productsKeys.counts() });
    },
  });
}

/**
 * Per-record partial-success summary for bulk mutations. `succeeded` and
 * `failed` always sum to the input ids length; callers decide what UX to
 * show (toast with "N of M …" when `failed` is non-empty, success toast
 * otherwise).
 */
export interface BulkMutationResult {
  succeeded: string[];
  failed: { id: string; error: Error }[];
}

async function runBulk(
  ids: string[],
  op: (id: string) => Promise<unknown>,
): Promise<BulkMutationResult> {
  const settled = await Promise.allSettled(ids.map((id) => op(id)));
  const succeeded: string[] = [];
  const failed: { id: string; error: Error }[] = [];
  settled.forEach((result, i) => {
    const id = ids[i];
    if (!id) {
      return;
    }
    if (result.status === "fulfilled") {
      succeeded.push(id);
    } else {
      const reason = result.reason;
      failed.push({ id, error: reason instanceof Error ? reason : new Error(String(reason)) });
    }
  });
  return { succeeded, failed };
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => runBulk(ids, deleteProduct),
    // Suppress per-request error toasts; caller consumes BulkMutationResult
    // and shows a single aggregated toast.
    meta: { silent: true },
    onSettled: (data) => {
      if (data?.succeeded.length) {
        removeFromCaches(queryClient, data.succeeded);
      }
      queryClient.invalidateQueries({
        queryKey: productsKeys.lists(),
        refetchType: "none",
      });
      queryClient.invalidateQueries({ queryKey: productsKeys.counts() });
    },
  });
}

export function useBulkArchiveProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => runBulk(ids, (id) => updateProduct(id, { status: "archived" })),
    meta: { silent: true },
    onSettled: (data) => {
      if (data?.succeeded.length) {
        patchStatusInCaches(queryClient, data.succeeded, "archived");
      }
      queryClient.invalidateQueries({
        queryKey: productsKeys.lists(),
        refetchType: "none",
      });
      queryClient.invalidateQueries({ queryKey: productsKeys.counts() });
    },
  });
}

export function useBulkUnarchiveProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => runBulk(ids, (id) => updateProduct(id, { status: "published" })),
    meta: { silent: true },
    onSettled: (data) => {
      if (data?.succeeded.length) {
        patchStatusInCaches(queryClient, data.succeeded, "published");
      }
      queryClient.invalidateQueries({
        queryKey: productsKeys.lists(),
        refetchType: "none",
      });
      queryClient.invalidateQueries({ queryKey: productsKeys.counts() });
    },
  });
}

export function useBulkEditProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, patch }: { ids: string[]; patch: Record<string, unknown> }) =>
      runBulk(ids, (id) => updateProduct(id, patch as Partial<ProductCreateInput>)),
    meta: { silent: true },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists(), refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: productsKeys.counts() });
      queryClient.invalidateQueries({ queryKey: productsKeys.filters() });
    },
  });
}
