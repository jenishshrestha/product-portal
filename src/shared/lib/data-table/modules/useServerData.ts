import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";
import type { AdvancedFilterState } from "./useAdvancedFilters";
import type { ResolvedDataSource } from "./useDataSource";
import { useDataTableQuery } from "./useDataTableQuery";

interface UseServerDataOptions<TData> {
  dataSource: ResolvedDataSource<TData>;
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  advancedFilters?: AdvancedFilterState;
}

export interface UseServerDataReturn<TData> {
  data: TData[];
  totalRows: number;
  isLoading: boolean;
  isFetching: boolean;
  pageCount: number | undefined;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const NOOP_QUERY_KEY = ["__datatable_noop__"] as const;
const noopQueryFn = () => Promise.resolve({ data: [] as never[], total: 0 });

export function useServerData<TData>(
  options: UseServerDataOptions<TData>,
): UseServerDataReturn<TData> {
  const { dataSource, pagination, sorting, columnFilters, globalFilter, advancedFilters } = options;
  const isServer = dataSource.kind === "server";

  // Query is always declared (hooks must be unconditional), but disabled and
  // pointed at a noop for client-mode sources.
  const serverQuery = useDataTableQuery({
    enabled: isServer,
    queryKey: isServer ? dataSource.queryKey : NOOP_QUERY_KEY,
    queryFn: isServer ? dataSource.queryFn : noopQueryFn,
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    advancedFilters,
  });

  if (dataSource.kind === "client") {
    const totalRows = dataSource.data.length;
    return {
      data: dataSource.data,
      totalRows,
      isLoading: false,
      isFetching: false,
      pageCount: undefined,
      hasNextPage: false,
      hasPreviousPage: pagination.pageIndex > 0,
    };
  }

  const totalRows = serverQuery.total;
  const pageCount = serverQuery.pageCount ?? Math.ceil(totalRows / pagination.pageSize);
  return {
    data: serverQuery.data,
    totalRows,
    isLoading: serverQuery.isLoading,
    isFetching: serverQuery.isFetching,
    pageCount,
    hasNextPage: pagination.pageIndex < Math.ceil(totalRows / pagination.pageSize) - 1,
    hasPreviousPage: pagination.pageIndex > 0,
  };
}
