import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { HierarchicalCheckboxGroup } from "./HierarchicalCheckboxGroup";

/**
 * Nested two-level checkbox picker built on CheckboxAccordion. Parents show an
 * indeterminate state when only some children are selected; toggling a parent
 * selects/deselects the whole group.
 */
const meta: Meta<typeof HierarchicalCheckboxGroup> = {
  title: "data-table/HierarchicalCheckboxGroup",
  component: HierarchicalCheckboxGroup,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof meta>;

const groups = [
  { name: "Engineering", items: ["Backend", "Frontend", "Mobile", "DevOps"] },
  { name: "Design", items: ["Product", "Marketing", "Brand"] },
  { name: "Operations", items: ["People", "Finance", "Legal"] },
];

function Template({ initialSelected = [] }: { initialSelected?: string[] }) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  return (
    <div className="w-80 rounded-md border p-2">
      <HierarchicalCheckboxGroup
        title="Department"
        groups={groups}
        selected={selected}
        onSelectedChange={setSelected}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <Template />,
};

export const PartiallySelected: Story = {
  render: () => <Template initialSelected={["Backend", "Frontend"]} />,
};

export const FullyPopulated: Story = {
  render: () => (
    <Template initialSelected={["Backend", "Frontend", "Mobile", "DevOps", "Product"]} />
  ),
};
