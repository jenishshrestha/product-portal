import { useDataTableAdvancedFilters, useDataTableSearch } from "@shared/lib/data-table";
import { XIcon } from "lucide-react";

interface FilterChipData {
  key: string;
  label: string;
  remove: () => void;
}

/**
 * Removable chip strip for active search + advanced filters. Mirrors the
 * Claude Design `.filter-bar` + `.filter-chip` styling (soft-primary pill
 * with a circular X). Rendered empty when no filters are active.
 */
export function ProductActiveFiltersBar() {
  const advanced = useDataTableAdvancedFilters();
  const { globalFilter, setGlobalFilter } = useDataTableSearch();

  const chips: FilterChipData[] = [];

  if (globalFilter) {
    chips.push({
      key: `search:${globalFilter}`,
      label: `"${globalFilter}"`,
      remove: () => setGlobalFilter(""),
    });
  }

  for (const [sectionKey, values] of Object.entries(advanced.filters)) {
    for (const value of values) {
      chips.push({
        key: `${sectionKey}:${value}`,
        label: value,
        remove: () => {
          advanced.setSection(
            sectionKey,
            values.filter((v) => v !== value),
          );
        },
      });
    }
  }

  if (chips.length === 0) {
    return null;
  }

  function clearAll() {
    advanced.clearAll();
    setGlobalFilter("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>Filtered by:</span>
      {chips.map((chip) => (
        <FilterChip key={chip.key} label={chip.label} onRemove={chip.remove} />
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-foreground"
      >
        Clear all
      </button>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/15 py-[3px] pr-1 pl-2.5 text-xs font-medium text-primary">
      <span className="truncate max-w-[200px]">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="inline-flex size-[18px] items-center justify-center rounded-full transition-colors hover:bg-primary/20"
      >
        <XIcon className="size-2.5" />
      </button>
    </span>
  );
}
