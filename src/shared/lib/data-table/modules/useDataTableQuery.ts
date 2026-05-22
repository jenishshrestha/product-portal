import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import { useMemo } from "react";
import type { DataTableQueryParams, DataTableServerResponse } from "../types/data-table.types";
import type { AdvancedFilterState } from "./useAdvancedFilters";

interface UseDataTableQueryOptions<TData> {
  enabled: boolean;
  queryKey: readonly unknown[];
  queryFn: (params: DataTableQueryParams) => Promise<DataTableServerResponse<TData>>;
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  advancedFilters?: AdvancedFilterState;
}

export function useDataTableQuery<TData>(options: UseDataTableQueryOptions<TData>) {
  const { queryKey, queryFn, pagination, sorting, columnFilters, globalFilter, advancedFilters } =
    options;

  // Memoize params so React Query sees a stable queryKey.
  // Without this, .map() creates new arrays every render → cache misses.
  const params: DataTableQueryParams = useMemo(
    () => ({
      page: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
      filters: columnFilters.map((f) => ({ id: f.id, value: f.value })),
      search: globalFilter || undefined,
      advancedFilters:
        advancedFilters && Object.keys(advancedFilters).length > 0 ? advancedFilters : undefined,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter,
      advancedFilters,
    ],
  );

  const query = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => queryFn(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled,
  });

  const result = query.data as DataTableServerResponse<TData> | undefined;

  return {
    data: result?.data ?? [],
    total: result?.total ?? 0,
    pageCount: result?.pageCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}
