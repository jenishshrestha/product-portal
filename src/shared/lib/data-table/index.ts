// ---- Components ----
export {
  createSelectionColumn,
  DataTableColumnHeader,
  DataTableRowActions,
  DT,
  FilterDropdown,
  type FilterDropdownOption,
  type FilterDropdownProps,
  type RowAction,
  useDataTableAdvancedFilters,
  useDataTableInstance,
  useDataTableReactive,
  useDataTableSearch,
  useDataTableView,
} from "./components";

// ---- Router adapter ----
export { createTanStackRouterAdapter, RouterAdapterProvider } from "./router";

// ---- Types ----
export type {
  AdvancedFilterConfig,
  DataTableColumnDef,
  DataTableConfig,
  DataTableQueryParams,
  DataTableServerResponse,
} from "./types/data-table.types";
