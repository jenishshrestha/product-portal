import { HeaderButton } from "@shared/components/HeaderButton";
import { PageHeader } from "@shared/components/PageHeader";
import {
  type AdvancedFilterConfig,
  type DataTableConfig,
  type DataTableQueryParams,
  type DataTableServerResponse,
  DT,
} from "@shared/lib/data-table";
import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { getUsers } from "./api/users.service";
import { DisableConfirmDialog } from "./components/DisableConfirmDialog";
import { ToolbarRoleFilter } from "./components/ToolbarRoleFilter";
import { userColumns } from "./lib/columns";
import { UsersActionsProvider } from "./lib/users-actions-context";
import {
  type AdminUser,
  USER_ROLES,
  USER_SORT_FIELDS,
  type UserRole,
  type UserSortBy,
  type UsersParams,
} from "./types/user.types";

const SORT_ALLOWLIST: ReadonlySet<string> = new Set(USER_SORT_FIELDS);

/**
 * Minimal advanced-filter config — required so DataTable propagates the
 * `role` filter state from `setSection("role", …)` (in `ToolbarRoleFilter`)
 * into the queryFn's `params.advancedFilters`. Without this, `enabled` is
 * false and the filter state is silently dropped before reaching the API.
 *
 * No sheet UI is rendered (we don't mount `<DT.AdvancedFilterButton />`),
 * so the section list mainly exists to drive any future sheet integration.
 */
const advancedFilters: AdvancedFilterConfig = {
  sections: [
    {
      type: "flat",
      key: "role",
      title: "Role",
      searchPlaceholder: "Search roles...",
    },
  ],
  queryKey: ["users", "filters"] as const,
  getOptions: async () => ({ role: [...USER_ROLES] }),
};

function coerceSortBy(id: string | undefined): UserSortBy {
  if (id && SORT_ALLOWLIST.has(id)) {
    return id as UserSortBy;
  }
  return "createdAt";
}

const ROLE_ALLOWLIST: ReadonlySet<string> = new Set(USER_ROLES);

/**
 * Hardens against stale URLs (e.g. `?af.role=foo`) — backend would 422,
 * but per security-standards.md §7 we validate URL-derived params before
 * forwarding them to the API.
 */
function coerceRole(value: string | undefined): UserRole | undefined {
  return value && ROLE_ALLOWLIST.has(value) ? (value as UserRole) : undefined;
}

async function usersQueryFn(
  params: DataTableQueryParams,
): Promise<DataTableServerResponse<AdminUser>> {
  const primarySort = params.sorting[0];
  const advanced = params.advancedFilters ?? {};

  const query: UsersParams = {
    page: params.page + 1, // DataTable is 0-based, backend is 1-based
    limit: params.pageSize,
    search: params.search || undefined,
    sortBy: coerceSortBy(primarySort?.id),
    order: primarySort ? (primarySort.desc ? "desc" : "asc") : "desc",
    role: coerceRole(advanced.role?.[0]),
  };

  const response = await getUsers(query);
  return {
    data: response.data,
    total: response.pagination.totalResults,
    pageCount: response.pagination.totalPages,
  };
}

/**
 * Admin Users page — DT.Root drives the listing (URL-synced search/sort/page,
 * server-side mode). Role filter is the only advanced filter; disabled state
 * isn't filterable per BE contract. Per-row mutations open the disable
 * confirmation dialog via UsersActionsContext; the role popover handles its
 * own state inside the column cell.
 */
export function UsersPage() {
  const [disableTarget, setDisableTarget] = useState<AdminUser | null>(null);

  const config = useMemo<DataTableConfig<AdminUser>>(
    () => ({
      columns: userColumns,
      dataSource: {
        mode: "server",
        queryKey: ["users", "list"] as const,
        queryFn: usersQueryFn,
      },
      pagination: {
        defaultPageSize: 20,
        pageSizeOptions: [10, 20, 50, 100],
      },
      enableSorting: true,
      enableRowSelection: false,
      syncWithUrl: true,
      getRowId: (user) => user.id,
      initialSorting: [{ id: "createdAt", desc: true }],
      advancedFilters,
    }),
    [],
  );

  return (
    <UsersActionsProvider onRequestDisable={setDisableTarget}>
      <DT.Root config={config} className="space-y-4">
        <PageHeader.Root>
          <PageHeader.Content>
            <PageHeader.Title>Users</PageHeader.Title>
            <PageHeader.Description>Manage admin and user accounts.</PageHeader.Description>
          </PageHeader.Content>
          <PageHeader.Actions>
            <HeaderButton asChild>
              <Link to="/admin/users/new">
                <PlusIcon className="size-3.5" />
                New user
              </Link>
            </HeaderButton>
          </PageHeader.Actions>
        </PageHeader.Root>

        <DT.Toolbar className="flex items-center gap-2">
          <DT.FilterBar searchPlaceholder="Search by name or email…">
            <ToolbarRoleFilter />
          </DT.FilterBar>
        </DT.Toolbar>

        <DT.Content />
        <DT.Pagination label="users" />
      </DT.Root>

      <DisableConfirmDialog user={disableTarget} onClose={() => setDisableTarget(null)} />
    </UsersActionsProvider>
  );
}
