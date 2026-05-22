import { Button } from "@shared/components/ui/Button";
import type { Meta, StoryObj } from "@storybook/react";
import { DownloadIcon, TrashIcon } from "lucide-react";
import { useFakeTable } from "../__fixtures__/story-fixtures";
import { DataTable } from "./DataTable";
import { DataTableBulkBar } from "./DataTableBulkBar";

/**
 * Fixed bottom-of-viewport action bar that appears when rows are selected.
 * Children slot receives the action buttons; counter and clear button are
 * handled internally.
 */
const meta: Meta<typeof DataTableBulkBar> = {
  title: "data-table/DataTableBulkBar",
  component: DataTableBulkBar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSelection: Story = {
  render: () => {
    const table = useFakeTable({ selected: { "0": true, "2": true, "4": true } });
    return (
      <div className="p-6">
        <DataTable table={table} />
        <DataTableBulkBar table={table}>
          <Button size="sm" variant="outline">
            <DownloadIcon className="size-4" /> Export
          </Button>
          <Button size="sm" variant="destructive">
            <TrashIcon className="size-4" /> Delete
          </Button>
        </DataTableBulkBar>
      </div>
    );
  },
};

export const HiddenWithoutSelection: Story = {
  render: () => {
    const table = useFakeTable();
    return (
      <div className="p-6">
        <DataTable table={table} />
        <DataTableBulkBar table={table}>
          <Button size="sm">Never visible — nothing selected</Button>
        </DataTableBulkBar>
        <p className="mt-4 text-sm text-muted-foreground">
          The bulk bar stays hidden when no rows are selected.
        </p>
      </div>
    );
  },
};
