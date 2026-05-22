import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/Card";
import { Checkbox } from "@shared/components/ui/Checkbox";
import type { Meta, StoryObj } from "@storybook/react";
import { type User, useFakeTable } from "../__fixtures__/story-fixtures";
import { DataTableCardGrid } from "./DataTableCardGrid";

/**
 * Card-grid alternative to the default table layout. Each row renders through
 * a caller-provided `cardRenderer`, with selection state wired through the
 * TanStack row model.
 */
const meta: Meta<typeof DataTableCardGrid> = {
  title: "data-table/DataTableCardGrid",
  component: DataTableCardGrid,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const cardRenderer = (
  user: User,
  { isSelected, onSelect }: { isSelected: boolean; onSelect: (v: boolean) => void },
) => (
  <Card className={isSelected ? "border-primary" : undefined}>
    <CardHeader className="flex-row items-center justify-between">
      <CardTitle className="text-sm">
        {user.firstName} {user.lastName}
      </CardTitle>
      <Checkbox checked={isSelected} onCheckedChange={(v) => onSelect(!!v)} aria-label="Select" />
    </CardHeader>
    <CardContent className="space-y-1 text-xs">
      <p className="text-muted-foreground">{user.email}</p>
      <p className="capitalize">
        {user.role} · {user.status}
      </p>
    </CardContent>
  </Card>
);

export const Populated: Story = {
  render: () => {
    const table = useFakeTable();
    return (
      <div className="p-6">
        <DataTableCardGrid table={table} cardRenderer={cardRenderer} />
      </div>
    );
  },
};

export const Loading: Story = {
  render: () => {
    const table = useFakeTable({ data: [] });
    return (
      <div className="p-6">
        <DataTableCardGrid table={table} cardRenderer={cardRenderer} isFetching skeletonCount={6} />
      </div>
    );
  },
};
