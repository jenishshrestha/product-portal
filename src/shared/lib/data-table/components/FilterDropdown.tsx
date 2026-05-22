import { Input } from "@shared/components/ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/components/ui/Popover";
import { cn } from "@shared/lib/utils";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

export type FilterDropdownOption = string | { label: string; value: string };

export interface FilterDropdownProps {
  /** Pill label, also rendered as the popup header (uppercased). */
  label: string;
  /** Leading icon on the pill (size-3.5 recommended). */
  icon?: ReactNode;
  options: readonly FilterDropdownOption[];
  selected: string[];
  onSelectedChange: (values: string[]) => void;
  /** When `false`, selecting an option replaces the selection. Defaults to `true`. */
  multiple?: boolean;
  /** Shows a search input inside the popover. Default off (small lists don't need it). */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Force width on the pill trigger; default auto-width. */
  className?: string;
}

function normalize(options: readonly FilterDropdownOption[]) {
  return options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
}

/**
 * Pill-triggered dropdown with a checkbox list — matches the Claude Design
 * catalog `.filter-pill` + `.dropdown` pattern. One chevron (from the pill
 * trigger), no second arrow from shadcn primitives.
 *
 * - `multiple` defaults to true (checkbox UX)
 * - `searchable` shows an Input at the top of the popover for long lists
 * - The pill flips to a primary-tinted active state once anything is selected
 */
export function FilterDropdown({
  label,
  icon,
  options,
  selected,
  onSelectedChange,
  multiple = true,
  searchable = false,
  searchPlaceholder = "Search...",
  className,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const items = useMemo(() => normalize(options), [options]);
  const filtered = useMemo(() => {
    if (!searchable || !query) {
      return items;
    }
    const needle = query.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(needle));
  }, [items, query, searchable]);

  const hasSelection = selected.length > 0;
  // Single-select reads the selected option's label on the trigger instead
  // of a count chip (which is always "1" and therefore useless). Falls back
  // to the count chip shape when the option isn't known or in multi mode.
  const singleSelectLabel =
    !multiple && selected.length === 1
      ? (items.find((item) => item.value === selected[0])?.label ?? selected[0])
      : undefined;

  function toggle(value: string) {
    if (!multiple) {
      onSelectedChange(selected.includes(value) ? [] : [value]);
      return;
    }
    onSelectedChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            hasSelection
              ? "border-primary/40 bg-primary/15 text-primary hover:bg-primary/20"
              : "border-border bg-card text-foreground hover:bg-muted",
            className,
          )}
        >
          {icon}
          <span>{label}</span>
          {singleSelectLabel ? (
            <span className="ml-0.5 max-w-[160px] truncate text-[0.8125rem] font-medium opacity-90">
              {singleSelectLabel}
            </span>
          ) : hasSelection ? (
            <span className="ml-0.5 inline-flex min-w-[18px] justify-center rounded-full bg-primary px-1.5 py-px text-[0.625rem] font-semibold leading-[1.4] text-primary-foreground">
              {selected.length}
            </span>
          ) : null}
          <ChevronDownIcon className="size-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0" sideOffset={6}>
        <div className="border-b border-border px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        {searchable && (
          <div className="relative border-b border-border p-2">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-7 text-xs"
            />
          </div>
        )}
        <ul className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-center text-xs text-muted-foreground">No matches.</li>
          )}
          {filtered.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => toggle(option.value)}
                  aria-pressed={isSelected}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted"
                >
                  {/* Visual-only checkbox. Using the Radix Checkbox primitive
                      here would render a <button role="checkbox"> nested inside
                      this row button — invalid HTML, hydration warning. The
                      row button carries all semantics + interactivity. */}
                  <span
                    aria-hidden
                    className={cn(
                      "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background",
                    )}
                  >
                    {isSelected && <CheckIcon className="size-3" />}
                  </span>
                  <span className="flex-1 truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
