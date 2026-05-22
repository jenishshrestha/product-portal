import type { ApiError } from "@shared/lib/dal";
import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AdminUser, CreateUserInput, PaginatedUsers, UserRole } from "../types/user.types";
import { usersKeys } from "./users.queries";
import { createUser, setUserDisabled, updateUserRoles } from "./users.service";

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<AdminUser, ApiError, CreateUserInput>({
    mutationFn: (body) => createUser(body),
    onSuccess: () => {
      // New row can land on any page under the current sort, so just refetch.
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

/**
 * Patch a single user inside every cached list page. Skips list pages that
 * don't contain the id so unaffected pages don't re-render.
 */
function patchUserInListCaches(queryClient: QueryClient, user: AdminUser): void {
  queryClient.setQueriesData<PaginatedUsers | undefined>(
    { queryKey: usersKeys.lists() },
    (prev) => {
      if (!prev) {
        return prev;
      }
      const idx = prev.data.findIndex((u) => u.id === user.id);
      if (idx < 0) {
        return prev;
      }
      const nextData = prev.data.slice();
      nextData[idx] = user;
      return { ...prev, data: nextData };
    },
  );
}

function findUserInListCaches(queryClient: QueryClient, id: string): AdminUser | undefined {
  return queryClient
    .getQueriesData<PaginatedUsers>({ queryKey: usersKeys.lists() })
    .flatMap(([, value]) => value?.data ?? [])
    .find((u) => u.id === id);
}

/**
 * Generic optimistic patch over a single user across list caches. Snapshots
 * the previous value, applies the patch, restores on error.
 *
 * Both role and disabled mutations follow the exact same dance — the only
 * variable bits are the request fn and which fields to patch — so this
 * helper hosts the shared scaffolding.
 */
function useOptimisticUserPatch<TVars extends { id: string }>(
  request: (vars: TVars) => Promise<AdminUser>,
  buildPatch: (current: AdminUser, vars: TVars) => AdminUser,
) {
  const queryClient = useQueryClient();
  return useMutation<AdminUser, ApiError, TVars, { previous?: AdminUser }>({
    mutationFn: request,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: usersKeys.lists() });
      const previous = findUserInListCaches(queryClient, vars.id);
      if (previous) {
        patchUserInListCaches(queryClient, buildPatch(previous, vars));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        patchUserInListCaches(queryClient, ctx.previous);
      }
    },
    onSuccess: (user) => {
      patchUserInListCaches(queryClient, user);
    },
  });
}

interface RoleChangeVars {
  id: string;
  roles: UserRole[];
}

export function useUpdateUserRoles() {
  return useOptimisticUserPatch<RoleChangeVars>(
    ({ id, roles }) => updateUserRoles(id, roles),
    (current, { roles }) => ({ ...current, roles }),
  );
}

interface DisabledVars {
  id: string;
  disabled: boolean;
}

export function useSetUserDisabled() {
  return useOptimisticUserPatch<DisabledVars>(
    ({ id, disabled }) => setUserDisabled(id, disabled),
    (current, { disabled }) => ({ ...current, disabled }),
  );
}
