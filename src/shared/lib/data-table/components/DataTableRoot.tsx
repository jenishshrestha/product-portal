import { useMemo } from "react";
import { useDataTable } from "../modules/useDataTable";
import type { DataTableConfig } from "../types/data-table.types";
import {
  AdvancedFilterCtx,
  type DataTableReactiveValue,
  type DataTableStableValue,
  ReactiveCtx,
  SearchCtx,
  StableCtx,
  ViewCtx,
} from "./DataTableContext";

interface DataTableRootProps<TData> {
  config: DataTableConfig<TData>;
  children: React.ReactNode;
  className?: string;
}

function DataTableRoot<TData>({ config, children, className }: DataTableRootProps<TData>) {
  const result = useDataTable(config);

  // Stable: table ref, config, callbacks — these references rarely change.
  // Consumers: CompoundFilter (table.getColumn), CompoundViewOptions (table.getAllColumns)
  const stableValue = useMemo(
    () => ({
      table: result.table,
      config,
      setGlobalFilter: result.setGlobalFilter,
      setView: result.setView,
      availableViews: result.availableViews,
    }),
    [result.table, config, result.setGlobalFilter, result.setView, result.availableViews],
  );

  // Search: only the globalFilter string.
  // Consumers: CompoundSearch
  const searchValue = useMemo(() => ({ globalFilter: result.globalFilter }), [result.globalFilter]);

  // View: only the view mode string.
  // Consumers: CompoundViewToggle, DataTableContent
  const viewValue = useMemo(() => ({ view: result.view }), [result.view]);

  // Reactive: everything that changes on table state mutation (row selection, sort, fetch, pagination).
  // Consumers: DataTableContent, CompoundPagination, CompoundBulkBar
  const reactiveValue = useMemo(
    () => ({
      table: result.table,
      isLoading: result.isLoading,
      isFetching: result.isFetching,
      isEmpty: result.isEmpty,
      data: result.data,
      totalRows: result.totalRows,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    }),
    [
      result.table,
      result.isLoading,
      result.isFetching,
      result.isEmpty,
      result.data,
      result.totalRows,
      result.hasNextPage,
      result.hasPreviousPage,
    ],
  );

  // Contexts are typed with `unknown` to be data-shape-agnostic across features.
  // Cast through unknown at the boundary since consumers downcast when they read.
  return (
    <StableCtx.Provider value={stableValue as unknown as DataTableStableValue<unknown>}>
      <SearchCtx.Provider value={searchValue}>
        <ViewCtx.Provider value={viewValue}>
          <ReactiveCtx.Provider value={reactiveValue as unknown as DataTableReactiveValue<unknown>}>
            <AdvancedFilterCtx.Provider value={result.advanced}>
              <div className={className}>{children}</div>
            </AdvancedFilterCtx.Provider>
          </ReactiveCtx.Provider>
        </ViewCtx.Provider>
      </SearchCtx.Provider>
    </StableCtx.Provider>
  );
}

export type { DataTableRootProps };
export { DataTableRoot };
