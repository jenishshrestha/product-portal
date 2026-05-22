import {
  type ColumnDef,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Table,
  useReactTable,
} from "@tanstack/react-table";
import { DataTableColumnHeader } from "../components/DataTableColumnHeader";
import { createSelectionColumn } from "../components/selection-column";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: "active" | "invited" | "disabled";
  role: "admin" | "editor" | "viewer";
  age: number;
}

export const sampleUsers: User[] = [
  {
    id: 1,
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    status: "active",
    role: "admin",
    age: 36,
  },
  {
    id: 2,
    firstName: "Grace",
    lastName: "Hopper",
    email: "grace@example.com",
    status: "active",
    role: "admin",
    age: 85,
  },
  {
    id: 3,
    firstName: "Alan",
    lastName: "Turing",
    email: "alan@example.com",
    status: "disabled",
    role: "editor",
    age: 41,
  },
  {
    id: 4,
    firstName: "Linus",
    lastName: "Torvalds",
    email: "linus@example.com",
    status: "active",
    role: "editor",
    age: 54,
  },
  {
    id: 5,
    firstName: "Barbara",
    lastName: "Liskov",
    email: "barbara@example.com",
    status: "invited",
    role: "viewer",
    age: 83,
  },
  {
    id: 6,
    firstName: "Guido",
    lastName: "van Rossum",
    email: "guido@example.com",
    status: "active",
    role: "editor",
    age: 67,
  },
  {
    id: 7,
    firstName: "Margaret",
    lastName: "Hamilton",
    email: "margaret@example.com",
    status: "active",
    role: "admin",
    age: 87,
  },
  {
    id: 8,
    firstName: "Tim",
    lastName: "Berners-Lee",
    email: "tim@example.com",
    status: "active",
    role: "editor",
    age: 68,
  },
  {
    id: 9,
    firstName: "Bjarne",
    lastName: "Stroustrup",
    email: "bjarne@example.com",
    status: "invited",
    role: "viewer",
    age: 73,
  },
  {
    id: 10,
    firstName: "Brendan",
    lastName: "Eich",
    email: "brendan@example.com",
    status: "active",
    role: "editor",
    age: 62,
  },
  {
    id: 11,
    firstName: "Rich",
    lastName: "Hickey",
    email: "rich@example.com",
    status: "disabled",
    role: "viewer",
    age: 64,
  },
  {
    id: 12,
    firstName: "Yukihiro",
    lastName: "Matsumoto",
    email: "yukihiro@example.com",
    status: "invited",
    role: "viewer",
    age: 58,
  },
];

export const userColumns: ColumnDef<User>[] = [
  createSelectionColumn<User>(),
  {
    accessorKey: "firstName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="First name" />,
    meta: { label: "First name" },
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last name" />,
    meta: { label: "Last name" },
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    meta: { label: "Email" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { label: "Status" },
    filterFn: "arrIncludesSome",
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    meta: { label: "Role" },
    filterFn: "arrIncludesSome",
  },
];

interface FakeTableOptions {
  data?: User[];
  columns?: ColumnDef<User>[];
  pageSize?: number;
  pageIndex?: number;
  selected?: Record<string, boolean>;
  sorting?: { id: string; desc: boolean }[];
  columnFilters?: { id: string; value: unknown }[];
}

/**
 * Returns a real TanStack Table instance for use inside Storybook stories.
 * Renders a hook, so must be called inside a React component (the story's render).
 */
export function useFakeTable(options: FakeTableOptions = {}): Table<User> {
  return useReactTable<User>({
    data: options.data ?? sampleUsers,
    columns: options.columns ?? userColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: {
        pageIndex: options.pageIndex ?? 0,
        pageSize: options.pageSize ?? 10,
      },
      sorting: options.sorting ?? [],
      columnFilters: options.columnFilters ?? [],
      rowSelection: options.selected ?? {},
    },
  });
}
