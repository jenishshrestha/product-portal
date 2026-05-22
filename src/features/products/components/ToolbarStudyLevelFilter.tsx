import { FilterDropdown, useDataTableAdvancedFilters } from "@shared/lib/data-table";
import { GraduationCapIcon } from "lucide-react";
import { useFilterOptions } from "../api/useProducts";

/**
 * Study Level filter pill — multi-select checkbox dropdown. Backend accepts
 * an array for `studyLevel`, so the pill commits every checkbox flip and
 * shows the count chip when one or more levels are selected.
 */
export function ToolbarStudyLevelFilter() {
  const advanced = useDataTableAdvancedFilters();
  const { data: options } = useFilterOptions();
  const selected = advanced.filters.studyLevel ?? [];
  const levels = options?.studyLevels ?? [];

  return (
    <FilterDropdown
      label="Study level"
      icon={<GraduationCapIcon className="size-3.5" />}
      options={levels}
      selected={selected}
      onSelectedChange={(values) => advanced.setSection("studyLevel", values)}
    />
  );
}
