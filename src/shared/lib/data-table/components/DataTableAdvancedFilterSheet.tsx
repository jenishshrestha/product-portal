import { Badge } from "@shared/components/ui/Badge";
import { Button } from "@shared/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/components/ui/Sheet";
import { useQuery } from "@tanstack/react-query";
import type {
  AdvancedFilterConfig,
  AdvancedFilterOption,
  AdvancedFilterSection,
  HierarchicalFilterGroup,
} from "../types/data-table.types";
import { CheckboxAccordion } from "./CheckboxAccordion";
import { useDataTableAdvancedFilters, useDataTableInstance } from "./DataTableContext";
import { HierarchicalCheckboxGroup } from "./HierarchicalCheckboxGroup";

interface DataTableAdvancedFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

type NormalizedOption = { label: string; value: string; icon?: React.ReactNode };

function normalize(raw: AdvancedFilterOption[] | undefined): NormalizedOption[] {
  return (raw ?? []).map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/**
 * Filter sheet that commits every toggle live to the DataTable state.
 *
 * Live-commit was a deliberate choice over the Atlas "Apply Filters" pattern:
 * the Filters button's count badge and the toolbar Clear button must reflect
 * sheet selections immediately, otherwise users see a sheet that claims to
 * hold 2 filters while the rest of the UI shows 0 until they Apply.
 *
 * TanStack Query deduplicates rapid params changes, so clicking multiple
 * checkboxes fast doesn't fan out N separate sustained requests — the
 * previous inflight is superseded by the latest params.
 */
export function DataTableAdvancedFilterSheet({
  open,
  onOpenChange,
  title = "Filters",
  description = "Narrow results by the options below.",
}: DataTableAdvancedFilterSheetProps) {
  const { config } = useDataTableInstance();
  const advancedConfig = config.advancedFilters as AdvancedFilterConfig | undefined;
  const advanced = useDataTableAdvancedFilters();

  const optionsQuery = useQuery({
    queryKey: advancedConfig?.queryKey ?? ["data-table", "advanced-filter-options"],
    queryFn: () => advancedConfig?.getOptions() ?? Promise.resolve({}),
    enabled: Boolean(advancedConfig) && open,
    staleTime: 1000 * 60 * 10,
  });

  if (!advancedConfig) {
    return null;
  }

  const options = optionsQuery.data ?? {};
  const sectionsByKey = new Map(advancedConfig.sections.map((s) => [s.key, s]));
  const groups = advancedConfig.groups ?? [];
  const groupedKeys = new Set(groups.flatMap((g) => g.keys));
  const ungroupedSections = advancedConfig.sections.filter((s) => !groupedKeys.has(s.key));

  function clearGroup(keys: string[]) {
    for (const key of keys) {
      advanced.clearSection(key);
    }
  }

  function renderSectionByKey(key: string) {
    const section = sectionsByKey.get(key);
    if (!section) {
      return null;
    }
    return renderSection(section, options, advanced);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
            {advanced.activeCount > 0 && (
              <Badge className="h-6 min-w-6 rounded-full px-2 text-xs font-semibold">
                {advanced.activeCount}
              </Badge>
            )}
            {advanced.activeCount > 0 && (
              <button
                type="button"
                onClick={advanced.clearAll}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <SheetDescription className="sr-only">{description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {groups.map((group) => {
            const groupActive = group.keys.some((k) => (advanced.filters[k]?.length ?? 0) > 0);
            return (
              <section key={group.title} className="flex flex-col gap-3">
                <header className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{group.title}</h3>
                  {groupActive && (
                    <button
                      type="button"
                      onClick={() => clearGroup(group.keys)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </header>
                <div className="flex flex-col gap-3 rounded-xl bg-muted p-4">
                  {group.keys.map((key) => (
                    <div key={key}>{renderSectionByKey(key)}</div>
                  ))}
                </div>
              </section>
            );
          })}

          {ungroupedSections.length > 0 && (
            <div className="flex flex-col gap-3">
              {ungroupedSections.map((section) => (
                <div key={section.key}>{renderSection(section, options, advanced)}</div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-6 py-4">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface FilterAccess {
  filters: Record<string, string[]>;
  setSection: (key: string, values: string[]) => void;
  clearSection: (key: string) => void;
}

function renderSection(
  section: AdvancedFilterSection,
  options: Record<string, unknown>,
  access: FilterAccess,
): React.ReactNode {
  const selected = access.filters[section.key] ?? [];

  if (section.type === "flat") {
    const values = normalize(options[section.key] as AdvancedFilterOption[] | undefined);
    return (
      <CheckboxAccordion.Root defaultOpen={section.defaultOpen}>
        <CheckboxAccordion.Header
          title={section.title}
          badgeCount={selected.length}
          onClear={selected.length > 0 ? () => access.clearSection(section.key) : undefined}
        />
        <CheckboxAccordion.Search placeholder={section.searchPlaceholder} />
        <CheckboxAccordion.List>
          {values.map((option) => (
            <CheckboxAccordion.Item
              key={option.value}
              label={option.label}
              value={option.value}
              checked={selected.includes(option.value)}
              onChange={() => access.setSection(section.key, toggleValue(selected, option.value))}
            />
          ))}
        </CheckboxAccordion.List>
      </CheckboxAccordion.Root>
    );
  }

  if (section.type === "chip") {
    const values = normalize(options[section.key] as AdvancedFilterOption[] | undefined);
    const multi = section.multi ?? false;
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-3">
        <p className="text-sm font-medium text-foreground">{section.title}</p>
        <div className="grid grid-cols-2 gap-2">
          {values.map((option) => {
            const active = selected.includes(option.value);
            return (
              <Button
                key={option.value}
                type="button"
                variant={active ? "default" : "outline"}
                className="h-10 justify-start gap-2 font-normal"
                onClick={() => {
                  if (multi) {
                    access.setSection(section.key, toggleValue(selected, option.value));
                  } else {
                    access.setSection(section.key, active ? [] : [option.value]);
                  }
                }}
              >
                {option.icon}
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  // hierarchical
  const raw = (options[section.key] as AdvancedFilterOption[] | undefined) ?? [];
  const flatItems = raw.map((option) => (typeof option === "string" ? option : option.value));
  const groups: HierarchicalFilterGroup[] = section.groupsFrom
    ? section.groupsFrom(options)
    : [{ name: section.title, items: flatItems }];

  return (
    <HierarchicalCheckboxGroup
      title={section.title}
      searchPlaceholder={section.searchPlaceholder}
      groups={groups}
      selected={selected}
      onSelectedChange={(values) => access.setSection(section.key, values)}
    />
  );
}
