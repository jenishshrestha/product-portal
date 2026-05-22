import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import type { RouterAdapter } from "./router-adapter.types";
import {
  parseFiltersParam,
  parseSortParam,
  serializeFiltersState,
  serializeSortState,
} from "./serialization";

interface UseUrlSyncedStateOptions {
  defaultPageSize?: number;
  prefix?: string;
  /**
   * Fallback sort returned when the URL has no `sort` param. Not written to
   * the URL — only surfaces in the derived state so column headers reflect
   * the server-side default.
   */
  initialSorting?: SortingState;
}

export interface UseUrlSyncedStateReturn {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  setPagination: OnChangeFn<PaginationState>;
  setSorting: OnChangeFn<SortingState>;
  setColumnFilters: OnChangeFn<ColumnFiltersState>;
  setGlobalFilter: (value: string) => void;
}

export function useUrlSyncedState(
  adapter: RouterAdapter,
  options: UseUrlSyncedStateOptions = {},
): UseUrlSyncedStateReturn {
  const { defaultPageSize = 10, prefix: p = "", initialSorting } = options;
  const { getParams, setParams } = adapter.useSearchParams();
  const params = getParams();

  // ---- Read state from URL params ----

  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: toNumber(params[`${p}page`], 0),
      pageSize: toNumber(params[`${p}pageSize`], defaultPageSize),
    }),
    [params[`${p}page`], params[`${p}pageSize`], defaultPageSize, p],
  );

  const sorting: SortingState = useMemo(() => {
    const parsed = parseSortParam(params[`${p}sort`] as string | undefined);
    return parsed.length > 0 ? parsed : (initialSorting ?? []);
  }, [params[`${p}sort`], p, initialSorting]);

  const columnFilters: ColumnFiltersState = useMemo(
    () => parseFiltersParam(params[`${p}filters`] as string | undefined),
    [params[`${p}filters`], p],
  );

  const globalFilter = (params[`${p}search`] as string) ?? "";

  // ---- Write state to URL params ----

  const setPagination: OnChangeFn<PaginationState> = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      setParams({
        [`${p}page`]: next.pageIndex === 0 ? undefined : next.pageIndex,
        [`${p}pageSize`]: next.pageSize === defaultPageSize ? undefined : next.pageSize,
      });
    },
    [pagination, setParams, defaultPageSize, p],
  );

  const setSorting: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setParams({
        [`${p}sort`]: serializeSortState(next),
        [`${p}page`]: undefined,
      });
    },
    [sorting, setParams, p],
  );

  const setColumnFilters: OnChangeFn<ColumnFiltersState> = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(columnFilters) : updater;
      setParams({
        [`${p}filters`]: serializeFiltersState(next),
        [`${p}page`]: undefined,
      });
    },
    [columnFilters, setParams, p],
  );

  const setGlobalFilter = useCallback(
    (value: string) => {
      setParams({
        [`${p}search`]: value || undefined,
        [`${p}page`]: undefined,
      });
    },
    [setParams, p],
  );

  return {
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    setPagination,
    setSorting,
    setColumnFilters,
    setGlobalFilter,
  };
}

/** Coerce a value to number, handling both typed numbers (TanStack Router) and strings (Next.js) */
function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}
