import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/DropdownMenu";
import { useDataTableInstance, useDataTableReactive } from "@shared/lib/data-table";
import { ChevronDownIcon } from "lucide-react";
import type { Product, ProductSortBy } from "../types/product.types";

interface SortOption {
  label: string;
  id: ProductSortBy;
  desc: boolean;
}

const DEFAULT_SORT: SortOption = { label: "Last updated", id: "updatedAt", desc: true };

// Ids constrained to the backend `sortBy` allowlist via `ProductSortBy`.
// Adding a new option here requires a matching backend enum entry + index.
const SORT_OPTIONS: readonly SortOption[] = [
  DEFAULT_SORT,
  { label: "Recently added", id: "createdAt", desc: true },
  { label: "Course name (A–Z)", id: "course_details.course_name", desc: false },
  { label: "Institution (A–Z)", id: "institution_details.institution_name", desc: false },
];

function sameSort(a: SortOption, b: { id: string; desc: boolean } | undefined) {
  return b != null && a.id === b.id && a.desc === b.desc;
}

/**
 * Summary row between toolbar and content. Typography + hover states mirror
 * the Product Portal catalog design (`results-meta` + `sort-trigger` rules
 * in catalog.css) — 12px muted label with 600-weight numbers, transparent
 * sort trigger that flips to muted bg on hover.
 */
export function ProductResultsBar() {
  const { table } = useDataTableInstance<Product>();
  const { data, totalRows } = useDataTableReactive<Product>();
  const current = table.getState().sorting[0];
  const currentLabel = SORT_OPTIONS.find((o) => sameSort(o, current))?.label ?? DEFAULT_SORT.label;

  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>
        Showing <b className="font-semibold text-foreground">{data.length}</b> of{" "}
        <b className="font-semibold text-foreground">{totalRows}</b> courses
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded px-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none"
          aria-label="Sort by"
        >
          <span>Sort by</span>
          <span className="font-medium text-foreground">{currentLabel}</span>
          <ChevronDownIcon className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={`${option.id}-${option.desc}`}
              onSelect={() => table.setSorting([{ id: option.id, desc: option.desc }])}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
