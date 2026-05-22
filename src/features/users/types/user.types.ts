/**
 * Admin user-management shape — mirrors the backend's `User` exactly as
 * emitted by `/api/v1/users` (see docs/backend-integration.md#user-management).
 *
 * Distinct from `@shared/types`'s `UserSchema` which is the session-side shape
 * read out of better-auth. The admin endpoint returns one extra field
 * (`disabled`) and we don't want session-side code to depend on it.
 */

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  roles: UserRole[];
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Backend sortable fields. Stick to these to avoid 422s — backend doesn't
 * reject unknown sort keys but performance is undefined off-index.
 */
export const USER_SORT_FIELDS = ["createdAt", "updatedAt", "name", "email"] as const;
export type UserSortBy = (typeof USER_SORT_FIELDS)[number];

export type SortOrder = "asc" | "desc";

export interface UsersParams {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
  sortBy?: UserSortBy;
  order?: SortOrder;
}

export interface PaginatedUsers {
  data: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roles?: UserRole[];
}
