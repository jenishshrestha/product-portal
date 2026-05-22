import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useCallback, useState } from "react";
import { useRouterAdapter } from "../router/RouterAdapterProvider";
import type { RouterAdapter } from "../router/router-adapter.types";
import { useUrlSyncedState } from "../router/useUrlSyncedState";

interface UseTableStateOptions {
  syncWithUrl: boolean;
  defaultPageSize: number;
  urlParamPrefix?: string;
  initialSorting?: SortingState;
}

export interface UseTableStateReturn {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  setPagination: OnChangeFn<PaginationState>;
  setSorting: OnChangeFn<SortingState>;
  setColumnFilters: OnChangeFn<ColumnFiltersState>;
  setGlobalFilter: (value: string) => void;
}

/**
 * Noop adapter — kept stable so `useUrlSyncedState` always has a valid
 * adapter to call hooks on, satisfying rules-of-hooks even when the
 * consumer hasn't mounted a `<RouterAdapterProvider>`.
 */
const noopAdapter: RouterAdapter = {
  useSearchParams: () => ({
    getParams: () => ({}),
    setParams: () => {},
  }),
};

/**
 * Table state adapter. Both URL-synced and local variants are hook-called on
 * every render (rules-of-hooks requires unconditional ordering), and the
 * result is selected based on `syncWithUrl`. The extra work is trivial —
 * just a few `useState` / `useCallback` allocations for the unused path.
 *
 * IMPORTANT: `syncWithUrl` must be stable for the lifetime of the containing
 * `<DT.Root>`. Flipping it mid-lifecycle would cause state to diverge between
 * the two backing stores.
 */
export function useTableState(options: UseTableStateOptions): UseTableStateReturn {
  const { syncWithUrl, defaultPageSize, urlParamPrefix, initialSorting } = options;
  const routerAdapter = useRouterAdapter();

  const urlState = useUrlSyncedState(routerAdapter ?? noopAdapter, {
    defaultPageSize,
    prefix: urlParamPrefix,
    initialSorting,
  });
  const localState = useLocalTableState(defaultPageSize, initialSorting);

  if (syncWithUrl) {
    if (!routerAdapter) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "DataTable: syncWithUrl is true but no RouterAdapter provided. " +
            "Wrap your app with <RouterAdapterProvider adapter={...}>. Falling back to local state.",
        );
      }
      return localState;
    }
    return urlState;
  }

  return localState;
}

// ---- Local state variant (shared by the syncWithUrl=false path) ----

function useLocalTableState(
  defaultPageSize: number,
  initialSorting?: SortingState,
): UseTableStateReturn {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilterState] = useState("");

  const resetPageIndex = useCallback(
    () => setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 })),
    [],
  );

  const onSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      setSorting(updater);
      resetPageIndex();
    },
    [resetPageIndex],
  );

  const onColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters(updater);
      resetPageIndex();
    },
    [resetPageIndex],
  );

  const setGlobalFilter = useCallback(
    (value: string) => {
      setGlobalFilterState(value);
      resetPageIndex();
    },
    [resetPageIndex],
  );

  return {
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    setPagination,
    setSorting: onSortingChange,
    setColumnFilters: onColumnFiltersChange,
    setGlobalFilter,
  };
}
