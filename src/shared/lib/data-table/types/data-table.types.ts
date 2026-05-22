import type { ColumnDef, SortingState, Table } from "@tanstack/react-table";

// ---- Data source (tagged union: client | server) ----

export type ClientSideDataSource<TData> = {
  mode: "client";
  data: TData[];
};

export type ServerSideDataSource<TData> = {
  mode: "server";
  queryKey: readonly unknown[];
  queryFn: (params: DataTableQueryParams) => Promise<DataTableServerResponse<TData>>;
};

export type DataSource<TData> = ClientSideDataSource<TData> | ServerSideDataSource<TData>;

// ---- Server-side contracts ----

export interface DataTableQueryParams {
  page: number;
  pageSize: number;
  sorting: { id: string; desc: boolean }[];
  filters: { id: string; value: unknown }[];
  search?: string;
  /** Values from the AdvancedFilter sheet, keyed by section.key */
  advancedFilters?: Record<string, string[]>;
}

export interface DataTableServerResponse<TData> {
  data: TData[];
  total: number;
  pageCount?: number;
}

// ---- Pagination config ----

export interface DataTablePaginationConfig {
  enabled?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
}

// ---- Filter option (used by AdvancedFilter sections) ----

export interface DataTableFilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

// ---- Extended column definition ----

export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue> & {
  meta?: {
    label?: string;
    hiddenByDefault?: boolean;
    exportable?: boolean;
    className?: string;
  };
};

// ---- Row & bulk actions ----

export interface DataTableRowAction<TData> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: TData) => void;
  variant?: "default" | "destructive";
  disabled?: (row: TData) => boolean;
  hidden?: (row: TData) => boolean;
}

export interface DataTableBulkAction<TData> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (rows: TData[]) => void;
  variant?: "default" | "destructive";
}

// ---- View types ----

export type DataTableView = "table" | "card";

// ---- Advanced filter config (sheet-based, multi-field) ----

export interface HierarchicalFilterGroup {
  name: string;
  items: string[];
}

export type AdvancedFilterSection =
  | {
      type: "flat";
      key: string;
      title: string;
      searchPlaceholder?: string;
      defaultOpen?: boolean;
    }
  | {
      type: "hierarchical";
      key: string;
      title: string;
      searchPlaceholder?: string;
      /** If absent, uses options[key] as a single flat group */
      groupsFrom?: (options: Record<string, unknown>) => HierarchicalFilterGroup[];
      defaultOpen?: boolean;
    }
  | {
      type: "chip";
      key: string;
      title: string;
      /** When true, multiple chips can be selected. Defaults to false (single-select). */
      multi?: boolean;
    };

export type AdvancedFilterOption =
  | string
  | { label: string; value: string; icon?: React.ReactNode };

export type AdvancedFilterOptions = Record<string, AdvancedFilterOption[]>;

/** Visual grouping of sections inside the filter sheet. */
export interface AdvancedFilterGroup {
  title: string;
  /** Section keys to include in this group. Order preserved. */
  keys: string[];
}

export interface AdvancedFilterConfig {
  sections: AdvancedFilterSection[];
  /**
   * Optional visual grouping. If provided, sections are rendered inside their
   * declared groups (with a grey container + per-group Clear). Sections not
   * listed in any group are rendered flat at the bottom. If omitted, all
   * sections render flat (current behavior).
   */
  groups?: AdvancedFilterGroup[];
  /** Async loader; DT caches via React Query when sheet opens */
  getOptions: () => Promise<AdvancedFilterOptions>;
  /** React Query key for options cache */
  queryKey?: readonly unknown[];
  /** Sync filter state to URL params (defaults to config.syncWithUrl) */
  syncWithUrl?: boolean;
}

// ---- Main config ----

export interface DataTableConfig<TData> {
  columns?: DataTableColumnDef<TData>[];
  cardRenderer?: (
    row: TData,
    options: { isSelected: boolean; onSelect: (selected: boolean) => void },
  ) => React.ReactNode;
  dataSource: DataSource<TData>;

  // Advanced filter (sheet-based, multi-field — opt-in via <DT.FilterBar />)
  advancedFilters?: AdvancedFilterConfig;

  // Features
  pagination?: DataTablePaginationConfig;
  enableSorting?: boolean;
  /**
   * Fallback sort applied when no explicit sort is active (URL param absent
   * or local state empty). Used to surface a server-side default sort in the
   * column header UI — e.g. `[{ id: "updatedAt", desc: true }]` makes the
   * Updated column show the desc arrow on first load.
   *
   * Not written to the URL — staying implicit keeps links clean. If the user
   * clicks a header to sort, that sort is written; clearing it falls back
   * here, so the indicator never goes blank.
   */
  initialSorting?: SortingState;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean | ((row: TData) => boolean);
  enableMultiSort?: boolean;
  defaultView?: DataTableView;

  // URL sync
  syncWithUrl?: boolean;
  urlParamPrefix?: string;

  /**
   * Stable row identity. Without this, TanStack Table keys rows by their
   * array index — any list refetch or in-place cache update re-creates every
   * row model, forcing all cells to re-render. Passing a stable id (e.g.
   * `(row) => row.id`) lets the table diff rows across updates so only
   * the rows whose data actually changed re-render.
   */
  getRowId?: (row: TData, index: number) => string;

  // Actions
  rowActions?: DataTableRowAction<TData>[];
  bulkActions?: DataTableBulkAction<TData>[];
  /**
   * Invoked when a table row body is clicked. Clicks that originate inside
   * a button / input / link / checkbox / menu element short-circuit before
   * this handler fires — so row-level actions and selection still work.
   */
  onRowClick?: (row: TData) => void;

  // Display
  emptyState?: React.ReactNode;

  // Export
  enableExport?: boolean;
  exportFilename?: string;
}

// ---- Hook return type ----

export interface AdvancedFiltersState {
  filters: Record<string, string[]>;
  setSection: (key: string, values: string[]) => void;
  setFilters: (filters: Record<string, string[]>) => void;
  clearSection: (key: string) => void;
  clearAll: () => void;
  activeCount: number;
  enabled: boolean;
}

export interface UseDataTableReturn<TData> {
  table: Table<TData>;
  isLoading: boolean;
  isFetching: boolean;
  isEmpty: boolean;
  data: TData[];
  totalRows: number;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  view: DataTableView;
  setView: (view: DataTableView) => void;
  availableViews: DataTableView[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  advanced: AdvancedFiltersState;
}
