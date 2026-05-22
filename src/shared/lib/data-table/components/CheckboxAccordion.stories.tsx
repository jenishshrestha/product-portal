import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CheckboxAccordion } from "./CheckboxAccordion";

/**
 * A compound collapsible checkbox group with optional search and badge count.
 * Drop-in replacement for multi-select filter sections.
 */
const meta: Meta<typeof CheckboxAccordion.Root> = {
  title: "data-table/CheckboxAccordion",
  component: CheckboxAccordion.Root,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof meta>;

const countries = [
  { label: "United States", value: "us" },
  { label: "United Kingdom", value: "uk" },
  { label: "Canada", value: "ca" },
  { label: "Germany", value: "de" },
  { label: "Japan", value: "jp" },
  { label: "Australia", value: "au" },
];

function Template({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (value: string, checked: boolean) => {
    setSelected((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)));
  };

  return (
    <div className="w-72 rounded-md border p-2">
      <CheckboxAccordion.Root defaultOpen={defaultOpen}>
        <CheckboxAccordion.Header
          title="Country"
          badgeCount={selected.length}
          onClear={selected.length > 0 ? () => setSelected([]) : undefined}
        />
        <CheckboxAccordion.Search placeholder="Search countries…" />
        <CheckboxAccordion.List>
          {countries.map((c) => (
            <CheckboxAccordion.Item
              key={c.value}
              label={c.label}
              value={c.value}
              checked={selected.includes(c.value)}
              onChange={toggle}
            />
          ))}
        </CheckboxAccordion.List>
      </CheckboxAccordion.Root>
    </div>
  );
}

export const Default: Story = {
  render: () => <Template />,
};

export const Collapsed: Story = {
  render: () => <Template defaultOpen={false} />,
};
