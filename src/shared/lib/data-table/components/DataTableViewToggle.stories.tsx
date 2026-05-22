import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { DataTableView } from "../types/data-table.types";
import { DataTableViewToggle } from "./DataTableViewToggle";

/**
 * Table/card layout toggle. Hidden automatically when fewer than two views
 * are available.
 */
const meta: Meta<typeof DataTableViewToggle> = {
  title: "data-table/DataTableViewToggle",
  component: DataTableViewToggle,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof meta>;

function Template({
  availableViews,
  initialView = "table",
}: {
  availableViews: DataTableView[];
  initialView?: DataTableView;
}) {
  const [view, setView] = useState<DataTableView>(initialView);
  return (
    <div className="space-y-2">
      <DataTableViewToggle view={view} onViewChange={setView} availableViews={availableViews} />
      <p className="text-muted-foreground text-xs">Current view: {view}</p>
    </div>
  );
}

export const BothViews: Story = {
  render: () => <Template availableViews={["table", "card"]} />,
};

export const DefaultToCard: Story = {
  render: () => <Template availableViews={["table", "card"]} initialView="card" />,
};

export const SingleViewHidden: Story = {
  render: () => <Template availableViews={["table"]} />,
};
