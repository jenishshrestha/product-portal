import { Badge } from "@shared/components/ui/Badge";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/components/ui/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/components/ui/Popover";
import { cn } from "@shared/lib/utils";
import { CheckIcon, PlusCircleIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useFilterOptions } from "../api/useProducts";

interface StudyAreasFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  "aria-invalid"?: boolean;
  id?: string;
  disabled?: boolean;
}

/**
 * Multi-select with creatable entries for `study_areas`. The suggestion list
 * is pulled from `/api/v1/products/filters` via `useFilterOptions` — whatever
 * study areas exist across other products show up as picks. Anything the
 * user types that doesn't match an existing option can be added via the
 * "Create" action; once it lands on a product + the filter endpoint
 * refreshes, it appears in the suggestion list for everyone.
 *
 * Selections render as removable badges inline; the "Add" trigger opens a
 * popover with a filterable Command palette.
 */
export function StudyAreasField({
  value,
  onChange,
  onBlur,
  "aria-invalid": ariaInvalid,
  id,
  disabled = false,
}: StudyAreasFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: options } = useFilterOptions();

  // Union of known + already-selected values. A just-created value won't be
  // in `options` yet — we surface it here so the checked state still reads
  // correctly if the user re-opens the popover.
  const allOptions = useMemo(() => {
    const set = new Set<string>();
    if (options?.studyAreas) {
      for (const s of options.studyAreas) {
        set.add(s);
      }
    }
    for (const v of value) {
      set.add(v);
    }
    return Array.from(set).sort();
  }, [options?.studyAreas, value]);

  const trimmedSearch = search.trim();
  const hasExactMatch = allOptions.some((opt) => opt.toLowerCase() === trimmedSearch.toLowerCase());
  const showCreate = trimmedSearch.length > 0 && !hasExactMatch;

  function toggle(area: string) {
    onChange(value.includes(area) ? value.filter((a) => a !== area) : [...value, area]);
  }

  function remove(area: string) {
    onChange(value.filter((a) => a !== area));
  }

  function createAndAdd() {
    if (!trimmedSearch || value.includes(trimmedSearch)) {
      return;
    }
    onChange([...value, trimmedSearch]);
    setSearch("");
  }

  return (
    <fieldset
      id={id}
      aria-invalid={ariaInvalid}
      onBlur={onBlur}
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        ariaInvalid &&
          "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {value.map((area) => (
        <Badge
          key={area}
          variant="secondary"
          className="h-[22px] gap-1 rounded-[4px] pr-1 text-xs font-medium"
        >
          {area}
          <button
            type="button"
            onClick={() => remove(area)}
            aria-label={`Remove ${area}`}
            className="-mr-0.5 inline-flex size-4 items-center justify-center rounded-sm opacity-60 hover:opacity-100"
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-[22px] items-center gap-1 rounded-[4px] border border-dashed border-border px-2 text-xs font-medium text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            <PlusCircleIcon className="size-3" />
            {value.length === 0 ? "Select study areas" : "Add"}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[280px] p-0">
          <Command>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search or create…"
            />
            <CommandList>
              <CommandEmpty>{showCreate ? null : "No matches."}</CommandEmpty>
              {allOptions.map((opt) => {
                const checked = value.includes(opt);
                return (
                  <CommandItem key={opt} value={opt} onSelect={() => toggle(opt)}>
                    <div
                      className={cn(
                        "flex size-4 items-center justify-center rounded-sm border border-muted-foreground/40",
                        checked && "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {checked && <CheckIcon className="size-3" />}
                    </div>
                    {opt}
                  </CommandItem>
                );
              })}
              {showCreate && (
                <CommandItem
                  value={`__create_${trimmedSearch}`}
                  onSelect={createAndAdd}
                  className="text-primary-strong"
                >
                  <PlusCircleIcon className="size-3.5" />
                  Create "{trimmedSearch}"
                </CommandItem>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </fieldset>
  );
}
