import { FilterDropdown, useDataTableAdvancedFilters } from "@shared/lib/data-table";
import { TargetIcon } from "lucide-react";
import { STATUS_LABELS } from "../lib/product-format";
import { PRODUCT_STATUSES } from "../types/product.types";

const STATUS_OPTIONS = PRODUCT_STATUSES.map((value) => ({
  label: STATUS_LABELS[value],
  value,
}));

/**
 * Inline toolbar pill for the Status filter. Single-select — backend only
 * accepts one status value per query. Render conditionally (admin-only)
 * from the page: non-admins are silently locked to `status=published` by
 * the backend, so the pill would be noise.
 */
export function ToolbarStatusFilter() {
  const advanced = useDataTableAdvancedFilters();
  const selected = advanced.filters.status ?? [];

  return (
    <FilterDropdown
      label="Status"
      icon={<TargetIcon className="size-3.5" />}
      options={STATUS_OPTIONS}
      selected={selected}
      onSelectedChange={(values) => advanced.setSection("status", values)}
      multiple={false}
    />
  );
}
