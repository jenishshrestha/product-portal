import { CheckboxAccordion } from "./CheckboxAccordion";

export interface HierarchicalGroup {
  name: string;
  items: string[];
}

interface HierarchicalCheckboxGroupProps {
  title: string;
  searchPlaceholder?: string;
  groups: HierarchicalGroup[];
  selected: string[];
  onSelectedChange: (values: string[]) => void;
}

/**
 * Parent/children filter group (e.g., Study Area → specific areas).
 * Parent checkbox shows indeterminate state when some children selected.
 * Ported from Atlas.
 */
export function HierarchicalCheckboxGroup({
  title,
  searchPlaceholder,
  groups,
  selected,
  onSelectedChange,
}: HierarchicalCheckboxGroupProps) {
  return (
    <CheckboxAccordion.Root>
      <CheckboxAccordion.Header title={title} badgeCount={selected.length} />
      <CheckboxAccordion.Search
        placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}...`}
      />
      <CheckboxAccordion.List>
        {groups.map((group) => {
          const selectedCount = group.items.filter((item) => selected.includes(item)).length;
          const isAllSelected = selectedCount === group.items.length && group.items.length > 0;
          const isSomeSelected = selectedCount > 0 && selectedCount < group.items.length;

          return (
            <div key={group.name} className="mb-2 last:mb-0">
              <CheckboxAccordion.HeaderCheckbox
                label={group.name}
                checked={isAllSelected}
                indeterminate={isSomeSelected}
                onChange={(checked) => {
                  if (checked) {
                    onSelectedChange(Array.from(new Set([...selected, ...group.items])));
                  } else {
                    onSelectedChange(selected.filter((v) => !group.items.includes(v)));
                  }
                }}
              />
              <div className="mt-1">
                {group.items.map((item) => (
                  <CheckboxAccordion.Item
                    key={item}
                    label={item}
                    value={item}
                    checked={selected.includes(item)}
                    indentLevel={1}
                    onChange={(val, checked) => {
                      if (checked) {
                        onSelectedChange([...selected, val]);
                      } else {
                        onSelectedChange(selected.filter((v) => v !== val));
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </CheckboxAccordion.List>
    </CheckboxAccordion.Root>
  );
}
