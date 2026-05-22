import type { DataTableColumnDef } from "@shared/lib/data-table";
import { DataTableColumnHeader } from "@shared/lib/data-table";
import { format, parseISO } from "date-fns";
import { RoleBadges } from "../components/RoleBadges";
import { UserNameCell } from "../components/UserNameCell";
import { UserRowActions } from "../components/UserRowActions";
import { UserStatusBadge } from "../components/UserStatusBadge";
import type { AdminUser } from "../types/user.types";

function formatJoined(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

/**
 * Backend's `sortBy` is a soft enum (any indexed field works) but we stick
 * to the four below per docs/backend-integration.md guidance. Other columns
 * have `enableSorting: false` so headers are static.
 */
export const userColumns: DataTableColumnDef<AdminUser>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <UserNameCell user={row.original} />,
    meta: { label: "Name" },
    size: 280,
  },
  {
    id: "email",
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    meta: { label: "Email" },
    size: 260,
  },
  {
    id: "roles",
    accessorFn: (u) => u.roles.join(","),
    header: () => <span className="text-[0.71875rem] font-medium">Roles</span>,
    cell: ({ row }) => <RoleBadges roles={row.original.roles} />,
    enableSorting: false,
    meta: { label: "Roles" },
    size: 140,
  },
  {
    id: "disabled",
    accessorKey: "disabled",
    header: () => <span className="text-[0.71875rem] font-medium">Status</span>,
    cell: ({ row }) => <UserStatusBadge disabled={row.original.disabled} />,
    enableSorting: false,
    meta: { label: "Status" },
    size: 100,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatJoined(row.original.createdAt)}</span>
    ),
    meta: { label: "Joined" },
    size: 140,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <UserRowActions user={row.original} />,
    enableSorting: false,
    meta: { label: "Actions" },
    size: 180,
  },
];
