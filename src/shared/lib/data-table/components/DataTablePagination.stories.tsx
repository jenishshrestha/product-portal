import type { Meta, StoryObj } from "@storybook/react";
import { sampleUsers, type User, useFakeTable } from "../__fixtures__/story-fixtures";
import { DataTablePagination } from "./DataTablePagination";

/**
 * Pagination controls with page-size selector, page counter, and smart
 * ellipsis for many pages. Derived entirely from the `Table` instance.
 */
const meta: Meta<typeof DataTablePagination> = {
  title: "data-table/DataTablePagination",
  component: DataTablePagination,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SinglePage: Story = {
  render: () => {
    // 12 rows with pageSize 20 → one page (pagination hides)
    const table = useFakeTable({ pageSize: 20 });
    return (
      <div className="p-6">
        <DataTablePagination table={table} />
      </div>
    );
  },
};

export const MultiplePages: Story = {
  render: () => {
    const table = useFakeTable({ pageSize: 3 });
    return (
      <div className="p-6">
        <DataTablePagination table={table} />
      </div>
    );
  },
};

export const ManyPagesWithEllipsis: Story = {
  render: () => {
    // Synthesize 60 rows to exceed the 7-page threshold. We know sampleUsers
    // has 12 entries, but provide a type-safe fallback so TS doesn't widen to
    // `User | undefined` — and we never branch before calling useFakeTable.
    const fallback: User = {
      id: 0,
      firstName: "",
      lastName: "",
      email: "",
      status: "active",
      role: "viewer",
      age: 0,
    };
    const data = Array.from({ length: 60 }, (_, i) => ({
      ...(sampleUsers[i % sampleUsers.length] ?? fallback),
      id: i + 1,
    }));
    const table = useFakeTable({ data, pageSize: 5, pageIndex: 4 });
    return (
      <div className="p-6">
        <DataTablePagination table={table} />
      </div>
    );
  },
};
