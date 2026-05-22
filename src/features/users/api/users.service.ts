/**
 * Service layer for admin user management. Mirrors `products.service.ts` —
 * calls go through the DAL's `apiFetch` + `unwrap` so error envelopes and
 * the success/data envelope are handled centrally.
 *
 * Endpoint contracts: docs/backend-integration.md#user-management.
 *   GET    /api/v1/users              — paginated list
 *   GET    /api/v1/users/:id          — single
 *   POST   /api/v1/users              — create (admin only)
 *   PATCH  /api/v1/users/:id/roles    — replace role set
 *   PATCH  /api/v1/users/:id/disabled — soft-ban toggle
 */

import { apiFetch, unwrap } from "@shared/lib/dal";
import type {
  AdminUser,
  CreateUserInput,
  PaginatedUsers,
  UserRole,
  UsersParams,
} from "../types/user.types";

interface EnvelopeSingle<T> {
  data: T;
}

export async function getUsers(params: UsersParams = {}): Promise<PaginatedUsers> {
  return unwrap(
    apiFetch<PaginatedUsers>({ key: "users.list", path: "/api/v1/users" }, { query: params }),
  );
}

export async function createUser(body: CreateUserInput): Promise<AdminUser> {
  const envelope = await unwrap(
    apiFetch<EnvelopeSingle<AdminUser>, CreateUserInput>(
      { key: "users.create", path: "/api/v1/users", method: "POST" },
      { body },
    ),
  );
  return envelope.data;
}

export async function updateUserRoles(id: string, roles: UserRole[]): Promise<AdminUser> {
  const envelope = await unwrap(
    apiFetch<EnvelopeSingle<AdminUser>, { roles: UserRole[] }>(
      { key: "users.updateRoles", path: "/api/v1/users/{id}/roles", method: "PATCH" },
      { pathParams: { id }, body: { roles } },
    ),
  );
  return envelope.data;
}

export async function setUserDisabled(id: string, disabled: boolean): Promise<AdminUser> {
  const envelope = await unwrap(
    apiFetch<EnvelopeSingle<AdminUser>, { disabled: boolean }>(
      { key: "users.setDisabled", path: "/api/v1/users/{id}/disabled", method: "PATCH" },
      { pathParams: { id }, body: { disabled } },
    ),
  );
  return envelope.data;
}
