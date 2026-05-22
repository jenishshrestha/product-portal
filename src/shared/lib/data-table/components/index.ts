// Consumer-facing named exports
export { DataTableColumnHeader } from "./DataTableColumnHeader";
export {
  useDataTableAdvancedFilters,
  useDataTableInstance,
  useDataTableReactive,
  useDataTableSearch,
  useDataTableView,
} from "./DataTableContext";
export { DataTableRowActions, type RowAction } from "./DataTableRowActions";
export {
  FilterDropdown,
  type FilterDropdownOption,
  type FilterDropdownProps,
} from "./FilterDropdown";
export { createSelectionColumn } from "./selection-column";

// Compound composition namespace (use via `DT.*`)
import { CompoundBulkBar } from "./DataTableBulkBar";
import { DataTableContent } from "./DataTableContent";
import { DataTableFilterBar } from "./DataTableFilterBar";
import { CompoundPagination } from "./DataTablePagination";
import { DataTableRoot } from "./DataTableRoot";
import { CompoundToolbar } from "./DataTableToolbar";
import { CompoundViewToggle } from "./DataTableViewToggle";

export const DT = {
  Root: DataTableRoot,
  Content: DataTableContent,
  Toolbar: CompoundToolbar,
  FilterBar: DataTableFilterBar,
  Pagination: CompoundPagination,
  BulkBar: CompoundBulkBar,
  ViewToggle: CompoundViewToggle,
};
