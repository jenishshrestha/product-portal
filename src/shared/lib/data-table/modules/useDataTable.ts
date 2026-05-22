import { useMemo } from "react";
import type { DataTableConfig, UseDataTableReturn } from "../types/data-table.types";
import { useAdvancedFilters } from "./useAdvancedFilters";
import { useDataSource } from "./useDataSource";
import { useServerData } from "./useServerData";
import { useTableInstance } from "./useTableInstance";
import { useTableState } from "./useTableState";
import { useViewState } from "./useViewState";

export function useDataTable<TData>(config: DataTableConfig<TData>): UseDataTableReturn<TData> {
  const {
    columns = [],
    cardRenderer,
    dataSource: rawDataSource,
    pagination: paginationConfig,
    enableSorting = true,
    enableRowSelection = false,
    enableMultiSort = false,
    syncWithUrl = true,
    initialSorting,
    getRowId,
  } = config;

  const defaultPageSize = paginationConfig?.defaultPageSize ?? 10;

  // 1. View state — useViewState's options are typed against `unknown`;
  // cast through unknown since the hook only inspects columns.length + presence
  // of cardRenderer (doesn't invoke them with TData).
  const { view, setView, availableViews } = useViewState({
    columns: columns as unknown as DataTableConfig<unknown>["columns"],
    cardRenderer: cardRenderer as unknown as DataTableConfig<unknown>["cardRenderer"],
    defaultView: config.defaultView,
  });

  // 2. Resolve data source (provider/api/server/client)
  const dataSource = useDataSource(rawDataSource);

  // 3. All table state (pagination, sorting, filters, search)
  const state = useTableState({
    syncWithUrl,
    defaultPageSize,
    urlParamPrefix: config.urlParamPrefix,
    initialSorting,
  });

  // 4. Advanced filters (opt-in via config.advancedFilters)
  const advanced = useAdvancedFilters(config.advancedFilters, {
    syncWithUrl: config.advancedFilters?.syncWithUrl ?? syncWithUrl,
    urlParamPrefix: config.urlParamPrefix ? `${config.urlParamPrefix}af.` : "af.",
  });

  // 5. Server-side data fetching (noop for client mode)
  const serverData = useServerData({
    dataSource,
    pagination: state.pagination,
    sorting: state.sorting,
    columnFilters: state.columnFilters,
    globalFilter: state.globalFilter,
    advancedFilters: advanced.enabled ? advanced.filters : undefined,
  });

  // 6. TanStack Table instance
  const { table } = useTableInstance({
    columns,
    data: serverData.data,
    totalRows: serverData.totalRows,
    pageCount: serverData.pageCount,
    isServer: dataSource.mode === "server",
    state,
    enableSorting,
    enableMultiSort,
    enableRowSelection,
    getRowId,
  });

  const isEmpty = !serverData.isLoading && serverData.data.length === 0;

  return useMemo(
    () => ({
      table,
      isLoading: serverData.isLoading,
      isFetching: serverData.isFetching,
      isEmpty,
      data: serverData.data,
      totalRows: serverData.totalRows,
      globalFilter: state.globalFilter,
      setGlobalFilter: state.setGlobalFilter,
      view,
      setView,
      availableViews,
      hasNextPage: serverData.hasNextPage,
      hasPreviousPage: serverData.hasPreviousPage,
      advanced,
    }),
    [
      table,
      serverData.isLoading,
      serverData.isFetching,
      isEmpty,
      serverData.data,
      serverData.totalRows,
      state.globalFilter,
      state.setGlobalFilter,
      view,
      setView,
      availableViews,
      serverData.hasNextPage,
      serverData.hasPreviousPage,
      advanced,
    ],
  );
}
