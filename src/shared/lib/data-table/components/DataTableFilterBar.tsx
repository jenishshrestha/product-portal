import { Input } from "@shared/components/ui/Input";
import { cn } from "@shared/lib/utils";
import { FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  useDataTableAdvancedFilters,
  useDataTableInstance,
  useDataTableSearch,
} from "./DataTableContext";

// Heavy sheet (Sheet + CheckboxAccordion + HierarchicalCheckboxGroup) — split out.
const DataTableAdvancedFilterSheet = lazy(() =>
  import("./DataTableAdvancedFilterSheet").then((m) => ({
    default: m.DataTableAdvancedFilterSheet,
  })),
);

interface DataTableFilterBarProps {
  searchPlaceholder?: string;
  sheetTitle?: string;
  sheetDescription?: string;
  className?: string;
  /** Slot for quick filters rendered between search input and Filters button. */
  children?: React.ReactNode;
  /**
   * Hide the inline "Clear" button. Useful when the page renders its own
   * active-filters bar with a dedicated clear action.
   */
  hideClear?: boolean;
}

/**
 * Combined search input + advanced-filter trigger.
 * Wires into DataTable context — search goes through setGlobalFilter,
 * advanced filters through useDataTableAdvancedFilters.
 *
 * Only renders the advanced-filter button when config.advancedFilters is set.
 */
export function DataTableFilterBar({
  searchPlaceholder = "Search...",
  sheetTitle,
  sheetDescription,
  className,
  children,
  hideClear = false,
}: DataTableFilterBarProps) {
  const { globalFilter, setGlobalFilter } = useDataTableSearch();
  const advanced = useDataTableAdvancedFilters();
  const { config } = useDataTableInstance();
  const [sheetOpen, setSheetOpen] = useState(false);
  // Keep the sheet mounted after first open so Radix's close animation can
  // play. Before first open, the lazy chunk stays un-fetched.
  const [hasEverOpened, setHasEverOpened] = useState(false);

  // Debounced search: the input value is local and fast, committing to DT
  // context (which drives URL sync + server queries) only after 300ms idle.
  // Matches the backend-integration.md guidance to debounce ≥ 300ms so we
  // don't hammer /products on every keystroke and trip the rate limiter.
  const [inputValue, setInputValue] = useState(globalFilter);

  // External writes (e.g. Clear All, programmatic reset) sync back into the
  // input so the field stays truthful.
  useEffect(() => {
    setInputValue(globalFilter);
  }, [globalFilter]);

  // Local edits → debounced commit. Cleanup on every keystroke cancels the
  // previous timeout; only the last value (after 300ms quiet) commits.
  useEffect(() => {
    if (inputValue === globalFilter) {
      return;
    }
    const handle = window.setTimeout(() => setGlobalFilter(inputValue), 300);
    return () => window.clearTimeout(handle);
  }, [inputValue, globalFilter, setGlobalFilter]);

  const hasAdvanced = Boolean(config.advancedFilters);
  const hasActive = advanced.activeCount > 0 || globalFilter.length > 0;

  // The Filters button reflects only dimensions the sheet actually renders,
  // so inline toolbar pills (children above) don't inflate the badge.
  const sheetActiveCount = useMemo(() => {
    const sheetKeys = new Set(config.advancedFilters?.sections.map((s) => s.key) ?? []);
    let count = 0;
    for (const [key, values] of Object.entries(advanced.filters)) {
      if (sheetKeys.has(key)) {
        count += values.length;
      }
    }
    return count;
  }, [config.advancedFilters, advanced.filters]);

  function clearAll() {
    advanced.clearAll();
    setGlobalFilter("");
  }

  return (
    <>
      <div className={className ?? "flex flex-wrap items-center gap-2 flex-1"}>
        <div className="relative min-w-0 flex-1 max-w-105">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground text-[0.8125rem]" />
          <Input
            placeholder={searchPlaceholder}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="h-9 pl-9 pr-12 text-[0.8125rem]"
          />
        </div>

        {children}

        {hasAdvanced && (
          <button
            type="button"
            onClick={() => {
              setHasEverOpened(true);
              setSheetOpen(true);
            }}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-[0.8125rem] font-medium transition-colors",
              sheetActiveCount > 0
                ? "border-primary/40 bg-primary/15 text-primary hover:bg-primary/20"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            <FilterIcon className="size-4" />
            <span>Filters</span>
            {sheetActiveCount > 0 && (
              <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 text-[0.625rem] font-semibold leading-[1.4] text-primary-foreground">
                {sheetActiveCount}
              </span>
            )}
          </button>
        )}

        {hasActive && !hideClear && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[0.8125rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {hasAdvanced && hasEverOpened && (
        <Suspense fallback={null}>
          <DataTableAdvancedFilterSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            title={sheetTitle}
            description={sheetDescription}
          />
        </Suspense>
      )}
    </>
  );
}
