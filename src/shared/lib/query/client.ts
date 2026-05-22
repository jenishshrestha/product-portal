import { ApiError } from "@shared/lib/dal";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * React Query client.
 *
 * Global error surfacing:
 * - Queries: toast any `ApiError` (reads don't have inline field errors).
 * - Mutations: toast `ApiError` only when there are no field-level errors —
 *   when `err.errors` is populated, the caller typically maps them onto form
 *   fields via `applyApiErrorToForm`, so a duplicate toast is noise.
 *
 * Components can suppress the global toast by setting
 * `meta: { silent: true }` on the query/mutation options.
 */
function shouldSilence(meta: Record<string, unknown> | undefined): boolean {
  return meta?.silent === true;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (shouldSilence(query.meta)) {
        return;
      }
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (shouldSilence(mutation.meta)) {
        return;
      }
      if (!(error instanceof ApiError)) {
        return;
      }
      if (error.errors) {
        return;
      }
      toast.error(error.message);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: import.meta.env.PROD,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * @deprecated Prefer per-feature Query Options Factories (see docs/data-access-layer.md).
 * Kept until existing callers migrate.
 */
export const queryKeys = {
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters: string) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  contacts: {
    all: ["contacts"] as const,
    lists: () => [...queryKeys.contacts.all, "list"] as const,
    list: (filters: string) => [...queryKeys.contacts.lists(), { filters }] as const,
    details: () => [...queryKeys.contacts.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.contacts.details(), id] as const,
  },
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    /**
     * Pass params structurally — TanStack Query hashes with sorted keys, so
     * `{page:1, limit:10}` and `{limit:10, page:1}` share a cache entry.
     * Previously accepted `JSON.stringify(params)` which was order-dependent.
     */
    list: (filters: unknown) => [...queryKeys.products.lists(), { filters }] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    filters: () => [...queryKeys.products.all, "filters"] as const,
  },
} as const;
