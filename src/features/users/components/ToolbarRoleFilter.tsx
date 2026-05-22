import { FilterDropdown, useDataTableAdvancedFilters } from "@shared/lib/data-table";
import { ShieldIcon } from "lucide-react";
import { USER_ROLES } from "../types/user.types";

const ROLE_OPTIONS = USER_ROLES.map((value) => ({
  label: value === "admin" ? "Admin" : "User",
  value,
}));

/**
 * Inline toolbar pill for the Role filter. Single-select — backend's
 * `?role=` param accepts one value.
 */
export function ToolbarRoleFilter() {
  const advanced = useDataTableAdvancedFilters();
  const selected = advanced.filters.role ?? [];
  return (
    <FilterDropdown
      label="Role"
      icon={<ShieldIcon className="size-3.5" />}
      options={ROLE_OPTIONS}
      selected={selected}
      onSelectedChange={(values) => advanced.setSection("role", values)}
      multiple={false}
    />
  );
}
