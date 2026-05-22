import type { Meta, StoryObj } from "@storybook/react";
import { useFakeTable } from "../__fixtures__/story-fixtures";
import { DataTableColumnHeader } from "./DataTableColumnHeader";

/**
 * Sortable column header with an integrated dropdown for sort direction and
 * column visibility. Wire it through column `meta` inside your ColumnDef.
 */
const meta: Meta<typeof DataTableColumnHeader> = {
  title: "data-table/DataTableColumnHeader",
  component: DataTableColumnHeader,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof meta>;

function HeaderDemo({ sorting }: { sorting?: { id: string; desc: boolean }[] }) {
  const table = useFakeTable(sorting ? { sorting } : {});
  const column = table.getColumn("firstName");
  if (!column) {
    return <span>Missing column</span>;
  }
  return <DataTableColumnHeader column={column} title="First name" />;
}

export const Sortable: Story = {
  render: () => <HeaderDemo />,
};

export const SortedAscending: Story = {
  render: () => <HeaderDemo sorting={[{ id: "firstName", desc: false }]} />,
};

export const SortedDescending: Story = {
  render: () => <HeaderDemo sorting={[{ id: "firstName", desc: true }]} />,
};
