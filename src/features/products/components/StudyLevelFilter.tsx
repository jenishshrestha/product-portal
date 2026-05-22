import { Popover, PopoverContent, PopoverTrigger } from "@shared/components/ui/Popover";
import { cn } from "@shared/lib/utils";
import { CheckIcon, ChevronDownIcon, MinusIcon } from "lucide-react";
import { useState } from "react";

export interface GroupDef {
  group: string;
  options: string[];
}

export const STUDY_LEVEL_GROUPS: GroupDef[] = [
  {
    group: "Undergraduate",
    options: ["Bachelor's Degree / Honours Degree", "Associate Degree"],
  },
  {
    group: "Postgraduate",
    options: [
      "Master's Degree (Coursework)",
      "Master's Degree (Research)",
      "MPhil",
      "Graduate Diploma / Postgraduate Diploma",
      "Graduate Certificate / Postgraduate Certificate",
      "Doctoral Degree (PhD / Professional Doctorate)",
    ],
  },
  {
    group: "Vocational Education",
    options: ["VET Course", "Diploma / Advanced Diploma", "Professional Course", "Certificate"],
  },
  {
    group: "ELICOS / English Language Course",
    options: [
      "IELTS",
      "PTE",
      "General English",
      "EAP",
      "TOEFL",
      "C1 Advanced (CAE)",
      "C2 Proficiency (CPE)",
      "OET",
    ],
  },
  {
    group: "Other",
    options: [],
  },
];

const ALL_OPTIONS = STUDY_LEVEL_GROUPS.flatMap((g) => g.options);

interface StudyLevelFilterProps {
  selected: string[];
  onSelectedChange: (values: string[]) => void;
  className?: string;
}

export function StudyLevelFilter({ selected, onSelectedChange, className }: StudyLevelFilterProps) {
  const [open, setOpen] = useState(false);
  const hasSelection = selected.length > 0;

  function toggleOption(value: string) {
    onSelectedChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  }

  function toggleGroup(group: GroupDef) {
    const allSelected = group.options.every((o) => selected.includes(o));
    if (allSelected) {
      onSelectedChange(selected.filter((v) => !group.options.includes(v)));
    } else {
      const toAdd = group.options.filter((o) => !selected.includes(o));
      onSelectedChange([...selected, ...toAdd]);
    }
  }

  function groupState(group: GroupDef): "all" | "some" | "none" {
    const count = group.options.filter((o) => selected.includes(o)).length;
    if (count === 0) return "none";
    if (count === group.options.length) return "all";
    return "some";
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          <span>Study Level</span>
          {hasSelection && (
            <span className="ml-0.5 inline-flex min-w-[18px] justify-center rounded-full bg-primary px-1.5 py-px text-[0.625rem] font-semibold leading-[1.4] text-primary-foreground">
              {selected.length}
            </span>
          )}
          <ChevronDownIcon className="size-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0" sideOffset={6}>
        <div className="border-b border-border px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Study Level
        </div>
        <ul className="max-h-80 overflow-y-auto py-1">
          {STUDY_LEVEL_GROUPS.map((group) => {
            const state = groupState(group);
            const hasOptions = group.options.length > 0;
            return (
              <li key={group.group}>
                {hasOptions ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-muted"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors",
                        state === "all"
                          ? "border-primary bg-primary text-primary-foreground"
                          : state === "some"
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-input bg-background",
                      )}
                    >
                      {state === "all" && <CheckIcon className="size-3" />}
                      {state === "some" && <MinusIcon className="size-3" />}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {group.group}
                    </span>
                  </button>
                ) : (
                  <div className="px-3 py-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {group.group}
                    </span>
                  </div>
                )}
                {group.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    aria-pressed={selected.includes(option)}
                    className="flex w-full items-center gap-2 py-1 pl-9 pr-3 text-left text-sm hover:bg-muted"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors",
                        selected.includes(option)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background",
                      )}
                    >
                      {selected.includes(option) && <CheckIcon className="size-3" />}
                    </span>
                    <span className="flex-1 truncate">{option}</span>
                  </button>
                ))}
              </li>
            );
          })}
        </ul>
        {hasSelection && (
          <div className="border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={() => onSelectedChange([])}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { ALL_OPTIONS as STUDY_LEVEL_ALL_OPTIONS };
