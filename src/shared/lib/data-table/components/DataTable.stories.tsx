import type { Meta, StoryObj } from "@storybook/react";
import { sampleUsers, useFakeTable } from "../__fixtures__/story-fixtures";
import { DataTable } from "./DataTable";

/**
 * Primary table renderer. Expects a TanStack `Table` instance built with the
 * repo's columns. Handles loading skeletons, empty state, and selected-row
 * styling automatically.
 */
const meta: Meta<typeof DataTable> = {
  title: "data-table/DataTable",
  component: DataTable,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  render: () => {
    const table = useFakeTable();
    return (
      <div className="p-6">
        <DataTable table={table} />
      </div>
    );
  },
};

export const Loading: Story = {
  render: () => {
    const table = useFakeTable({ data: [] });
    return (
      <div className="p-6">
        <DataTable table={table} isFetching skeletonRows={6} />
      </div>
    );
  },
};

export const Empty: Story = {
  render: () => {
    const table = useFakeTable({ data: [] });
    return (
      <div className="p-6">
        <DataTable table={table} />
      </div>
    );
  },
};

export const WithSelection: Story = {
  render: () => {
    const table = useFakeTable({
      data: sampleUsers.slice(0, 5),
      selected: { "0": true, "2": true },
    });
    return (
      <div className="p-6">
        <DataTable table={table} />
      </div>
    );
  },
};
