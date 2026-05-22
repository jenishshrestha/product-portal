import { useCallback, useMemo, useRef, useState } from "react";
import { useRouterAdapter } from "../router/RouterAdapterProvider";
import type { RouterAdapter } from "../router/router-adapter.types";
import { buildAdvancedFilterUpdates, readAdvancedFiltersFromParams } from "../router/serialization";
import type { AdvancedFilterConfig } from "../types/data-table.types";

export type AdvancedFilterState = Record<string, string[]>;

export interface UseAdvancedFiltersReturn {
  /** Current filter values, keyed by section.key */
  filters: AdvancedFilterState;
  /** Set filters for a single section */
  setSection: (key: string, values: string[]) => void;
  /** Replace the entire filter state */
  setFilters: (filters: AdvancedFilterState) => void;
  /** Clear one section */
  clearSection: (key: string) => void;
  /** Clear all filters */
  clearAll: () => void;
  /** Total count of selected values across all sections */
  activeCount: number;
  /** Whether an advanced-filter config is present */
  enabled: boolean;
}

interface UseAdvancedFiltersOptions {
  /** When true and a RouterAdapter is available, persists to URL. */
  syncWithUrl?: boolean;
  /** URL param prefix for filter sections (defaults to "af."). */
  urlParamPrefix?: string;
}

/** Noop adapter so the hook can always call useSearchParams — rules-of-hooks */
const noopAdapter: RouterAdapter = {
  useSearchParams: () => ({
    getParams: () => ({}),
    setParams: () => {},
  }),
};

/**
 * Advanced filter state — owned by DataTable when config.advancedFilters is set.
 * Consumed by FilterBar, AdvancedFilterSheet, and queryFn via DataTableQueryParams.advancedFilters.
 *
 * When `syncWithUrl` is true and a RouterAdapter is provided, the filter state is
 * read from / written to the URL under the `af` search param. Otherwise, falls back
 * to local React state.
 */
export function useAdvancedFilters(
  config: AdvancedFilterConfig | undefined,
  options: UseAdvancedFiltersOptions = {},
): UseAdvancedFiltersReturn {
  const { syncWithUrl = false, urlParamPrefix = "af." } = options;

  const routerAdapter = useRouterAdapter();
  const adapter = routerAdapter ?? noopAdapter;
  const { getParams, setParams } = adapter.useSearchParams();
  const params = getParams();

  const urlActive = syncWithUrl && routerAdapter !== null;

  // `getParams()` returns a fresh object each render from `useSearch`. Cache
  // the parsed filter state on a ref keyed by a structural hash of only the
  // prefix-relevant subset — this way, unrelated URL param changes don't
  // invalidate downstream consumers that depend on `urlFilters` identity.
  const cacheRef = useRef<{ key: string; value: AdvancedFilterState }>({
    key: "__init__",
    value: {},
  });
  let nextValue = cacheRef.current.value;
  if (urlActive) {
    let key = "";
    for (const [k, v] of Object.entries(params)) {
      if (k.startsWith(urlParamPrefix)) {
        key += `${k}=${JSON.stringify(v)};`;
      }
    }
    if (key !== cacheRef.current.key) {
      nextValue = readAdvancedFiltersFromParams(params, urlParamPrefix);
      cacheRef.current = { key, value: nextValue };
    }
  } else if (cacheRef.current.key !== "__local__") {
    nextValue = {};
    cacheRef.current = { key: "__local__", value: nextValue };
  }
  const urlFilters = nextValue;

  const [localFilters, setLocalFilters] = useState<AdvancedFilterState>({});

  const filters = urlActive ? urlFilters : localFilters;

  const writeFilters = useCallback(
    (next: AdvancedFilterState) => {
      if (urlActive) {
        // `getParams()` reads current URL state at call time — safe to skip
        // params from the dep list since buildAdvancedFilterUpdates only uses
        // it to diff against the incoming `next` at write-time.
        setParams(buildAdvancedFilterUpdates(next, getParams(), urlParamPrefix));
      } else {
        setLocalFilters(next);
      }
    },
    [urlActive, setParams, urlParamPrefix, getParams],
  );

  const setFilters = useCallback(
    (next: AdvancedFilterState) => {
      writeFilters(next);
    },
    [writeFilters],
  );

  const setSection = useCallback(
    (key: string, values: string[]) => {
      const next =
        values.length === 0
          ? (() => {
              const { [key]: _removed, ...rest } = filters;
              return rest;
            })()
          : { ...filters, [key]: values };
      writeFilters(next);
    },
    [filters, writeFilters],
  );

  const clearSection = useCallback(
    (key: string) => {
      const { [key]: _removed, ...rest } = filters;
      writeFilters(rest);
    },
    [filters, writeFilters],
  );

  const clearAll = useCallback(() => {
    writeFilters({});
  }, [writeFilters]);

  const activeCount = useMemo(
    () => Object.values(filters).reduce((sum, values) => sum + values.length, 0),
    [filters],
  );

  return {
    filters,
    setSection,
    setFilters,
    clearSection,
    clearAll,
    activeCount,
    enabled: Boolean(config),
  };
}
