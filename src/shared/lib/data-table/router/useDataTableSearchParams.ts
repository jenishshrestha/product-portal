import { createTanStackRouterAdapter } from "./tanstack-router-adapter";
import { type UseUrlSyncedStateReturn, useUrlSyncedState } from "./useUrlSyncedState";

interface UseDataTableSearchParamsOptions {
  defaultPageSize?: number;
  prefix?: string;
}

export type { UseUrlSyncedStateReturn as UseDataTableSearchParamsReturn };

const tanStackAdapter = createTanStackRouterAdapter();

/**
 * URL-synced table state using TanStack Router.
 *
 * @deprecated Use `<RouterAdapterProvider>` + `useUrlSyncedState()` instead
 * for framework-agnostic URL sync. This function is kept for backwards compatibility.
 */
export function useDataTableSearchParams(
  options: UseDataTableSearchParamsOptions = {},
): UseUrlSyncedStateReturn {
  return useUrlSyncedState(tanStackAdapter, options);
}
