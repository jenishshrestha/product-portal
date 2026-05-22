import {
  type ColumnDef,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";
import type { DataTableColumnDef } from "../types/data-table.types";
import type { UseTableStateReturn } from "./useTableState";

interface UseTableInstanceOptions<TData> {
  columns: DataTableColumnDef<TData>[];
  data: TData[];
  totalRows: number;
  pageCount: number | undefined;
  isServer: boolean;
  state: UseTableStateReturn;
  enableSorting: boolean;
  enableMultiSort: boolean;
  enableRowSelection: boolean | ((row: TData) => boolean);
  getRowId?: (row: TData, index: number) => string;
}

export function useTableInstance<TData>(options: UseTableInstanceOptions<TData>) {
  const {
    columns,
    data,
    totalRows,
    pageCount,
    isServer,
    state,
    enableSorting,
    enableMultiSort,
    enableRowSelection,
    getRowId,
  } = options;

  // Column visibility — initialize hidden-by-default columns
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const initial: VisibilityState = {};
    for (const col of columns) {
      if (col.meta?.hiddenByDefault && "id" in col && col.id) {
        initial[col.id] = false;
      }
    }
    return initial;
  });

  // Row selection
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable<TData>({
    data,
    columns: columns as ColumnDef<TData, unknown>[],
    ...(getRowId ? { getRowId } : {}),
    state: {
      pagination: state.pagination,
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      globalFilter: state.globalFilter,
      columnVisibility,
      rowSelection,
    },

    // State handlers
    onPaginationChange: state.setPagination,
    onSortingChange: state.setSorting,
    onColumnFiltersChange: state.setColumnFilters,
    onGlobalFilterChange: state.setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,

    // Row models
    getCoreRowModel: getCoreRowModel(),
    ...(isServer
      ? {
          manualPagination: true,
          manualSorting: true,
          manualFiltering: true,
          pageCount,
          rowCount: totalRows,
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          getSortedRowModel: getSortedRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          getFacetedRowModel: getFacetedRowModel(),
          getFacetedUniqueValues: getFacetedUniqueValues(),
        }),

    // Feature flags
    enableSorting,
    enableMultiSort,
    enableRowSelection:
      typeof enableRowSelection === "function"
        ? (row) => enableRowSelection(row.original)
        : enableRowSelection,
  });

  return { table };
}
