# Backend Integration — product-portal-backend

> Non-obvious integration notes for calling the Heubert backend. Endpoint shapes, request/response schemas, and error codes are generated from the backend's OpenAPI — **do not maintain copies of them here**.

If you only read one section, read [Error envelope (custom DAL parser required)](#error-envelope-custom-dal-parser-required).

## Source of truth

- **Live OpenAPI spec**: `${VITE_API_URL}/openapi.json`
- **Swagger UI**: `${VITE_API_URL}/docs`
- **Generate types**: `bunx openapi-typescript ${VITE_API_URL}/openapi.json -o src/shared/lib/api/schema.gen.ts`

Regenerate types after any backend PR that changes schemas. The spec is always current.

## Mount points

```
/api/auth/*    better-auth handler — used by authClient, not called directly
/api/v1/*      business APIs (products, users) — DAL endpoints target these
/healthz       liveness (no auth)
/readyz        readiness w/ Mongo ping (no auth)
/openapi.json  the spec
/docs          Swagger UI
```

**Do not prefix auth calls with `/api/v1`.** better-auth lives at `/api/auth` directly. Only business endpoints use the `v1` prefix.

## Cookies, CORS, CSRF

- Session is an httpOnly cookie. No tokens in JS, no `Authorization` header.
- **Every** fetch needs `credentials: 'include'`. The DAL's executor must set this globally.
- Frontend origin (dev: `http://localhost:5173`) must be in the backend's `CORS_ORIGINS`. If 401s appear on every call, check this first.
- No CSRF token. better-auth validates `Origin` against its trusted list.

## Session shape (better-auth + custom `roles` field)

The `roles` field is a better-auth `additionalField` — **the client doesn't know about it unless you wire `inferAdditionalFields`**:

```ts
import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth`,
  plugins: [
    inferAdditionalFields({
      user: { roles: { type: 'string[]' } },
    }),
  ],
});
```

Without the plugin, `roles` exists at runtime but TypeScript won't type it.

Current roles: `'user'` | `'admin'`. Sign-up cannot set `roles` — backend forces `['user']` regardless of what you send.

## Google sign-in

Standard OAuth redirect flow (not One Tap). Credentials live on the backend; FE only triggers the flow.

```ts
// "Sign in with Google" button handler
const origin = window.location.origin; // e.g. http://localhost:5173
await authClient.signIn.social({
  provider: 'google',
  callbackURL:      `${origin}/dashboard`, // success
  errorCallbackURL: `${origin}/login`,     // rejection
});
```

⚠️ **`callbackURL` MUST be absolute** (full origin + path). A relative path like `/dashboard` is resolved by better-auth against the **backend** `BETTER_AUTH_URL` (`http://localhost:3000`), not the FE origin — the user lands on the backend's 404 page instead of the FE. Always use `window.location.origin + '/your-path'`.

`authClient` calls `POST /api/auth/sign-in/social`, which returns `{ url, redirect: true }`. The browser is sent to Google; on return, the backend handles `/api/auth/callback/google`, sets the session cookie, and redirects to your `callbackURL`. Backend's `trustedOrigins` (driven by `CORS_ORIGINS`) enforces that only FE origins can be used as callbacks — non-trusted URLs are rejected.

### Domain allowlist

Backend rejects any Google account whose email domain isn't in `ALLOWED_EMAIL_DOMAINS` (currently `experteducation.com.au` + `heubert.com`). On rejection the browser lands on `errorCallbackURL` with a query string:

```
/login?error=email_domain_not_allowed
```

Read `URLSearchParams` on the page mounted at `errorCallbackURL` and show a clear "only office accounts can sign in" message for that code. Other better-auth errors (state mismatch, user disabled, etc.) come through the same `?error=...` channel — render a generic "sign-in failed" fallback for unknown codes.

### What the FE must NOT do

- Don't put `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` in any `VITE_*` env. The FE doesn't need either for this flow — Google never calls the FE directly.
- Don't load `https://accounts.google.com/gsi/client` or call `google.accounts.id.*` — that's One Tap, which we are not shipping yet.

## Error envelope (custom DAL parser required)

Backend returns a shape that matches **neither** the default NestJS parser nor the generic `{ message, errors }` parser bundled with the DAL:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [ /* optional — Zod issues for 422, etc. */ ],
    "requestId": "01HXXX..."
  }
}
```

Write a `heubertErrorParser` and register it once at DAL init:

```ts
// src/shared/lib/dal/parsers/heubert.ts
import type { ErrorParser } from '@shared/lib/dal';

export const heubertErrorParser: ErrorParser = (status, body) => {
  const err = (body as { error?: { code: string; message: string; details?: unknown; requestId?: string } })?.error;
  if (!err) return { code: 'UNKNOWN', message: 'Unknown error' };

  const fieldErrors: Record<string, string[]> = {};
  if (status === 422 && Array.isArray(err.details)) {
    // Zod issues: [{ path: ['email'], message: '...' }, ...]
    for (const issue of err.details as Array<{ path?: (string | number)[]; message: string }>) {
      const key = issue.path?.join('.') ?? '_';
      (fieldErrors[key] ??= []).push(issue.message);
    }
  }

  return {
    code: err.code,
    message: err.message,
    requestId: err.requestId,
    fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
  };
};
```

```ts
configureDal({ errorParser: heubertErrorParser });
```

**Always surface `requestId` in error toasts.** It's the key for backend log / Sentry lookup. Copy-to-clipboard button on the toast is ideal.

### Error codes (from backend `http-errors.ts`)

| HTTP | code | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Generic client error (e.g. self-removal of admin role) |
| 401 | `UNAUTHORIZED` | Not logged in / session expired |
| 403 | `FORBIDDEN` | Logged in, lacks role |
| 404 | `NOT_FOUND` | Missing — or hidden from non-admin |
| 409 | `CONFLICT` / `DUPLICATE_KEY` | Unique constraint |
| 422 | `VALIDATION_ERROR` | Zod failure, `details` is issue array |
| 429 | `TOO_MANY_REQUESTS` | Global rate limit |
| 500 | `INTERNAL_ERROR` | Server bug — log the requestId |

### 401 vs 403 handling

- **401** → clear session state, redirect to `/login`. Don't retry.
- **403** → show "not allowed" UI in place. User is logged in, just lacks role. Don't redirect.

## Response envelope

Single: `{ "data": {...} }` — Paginated: `{ "data": [...], "pagination": { page, limit, totalPages, totalResults } }` — Delete: 204, no body.

DAL response unwrappers should strip `data` and expose `pagination` as a sibling.

## User management

Backend ships a complete admin-only management surface. **Editing a user's `name` / `email` is intentionally NOT supported yet** — see the [Limitations](#limitations) at the end of this section.

### Capability matrix

| Action | `user` role | `admin` role |
|---|---|---|
| List / view users | ❌ 403 | ✅ |
| Create user | ❌ 403 | ✅ |
| Disable / re-enable user | ❌ 403 | ✅ |
| Change another user's roles | ❌ 403 | ✅ |
| View / edit own profile | not exposed yet | not exposed yet |

Users do **not** see other users at all. The admin Users page should be hidden from non-admins (route guard + nav item gating off `isAdmin`).

### Endpoints (full shapes in OpenAPI)

| Method | Path | Notes |
|---|---|---|
| GET    | `/api/v1/users`              | Paginated. Query: `search`, `role`, `page`, `limit`, `sortBy`, `order`. |
| GET    | `/api/v1/users/:id`          | Single user. |
| POST   | `/api/v1/users`              | Body: `{ name, email, password, roles? }`. `roles` defaults to `['user']`. |
| PATCH  | `/api/v1/users/:id/roles`    | Body: `{ roles: string[] }`. **Replaces** the role set (not delta). |
| PATCH  | `/api/v1/users/:id/disabled` | Body: `{ disabled: boolean }`. |

`User` shape: `{ id, name, email, emailVerified, image, roles, disabled, createdAt, updatedAt }`.

### Listing — scenarios

**Filters available**: `search` (matches `name` OR `email`, case-insensitive substring), `role` (`user` | `admin`).
**Filters NOT available**: there is **no `disabled` filter** on the list endpoint. If you need a "disabled users" tab, fetch all and filter client-side, or request a backend addition.

- Empty result → `{ data: [], pagination: { totalResults: 0, totalPages: 1, ... } }`. Show empty state.
- Search hits 0 → same shape. Show "No users matching '<query>'."
- Debounce search input ≥ 300ms (global rate limit applies).
- Default sort: `createdAt desc`. Sortable: any indexed field on the user model — stick to `createdAt`, `updatedAt`, `name`, `email` to be safe.

### Creating a user — scenarios

Body:
```json
{ "name": "Jane Editor", "email": "jane@heubert.com", "password": "ChangeMe!123", "roles": ["user"] }
```

| Outcome | HTTP | Code | UI message |
|---|---|---|---|
| Success | 201 | — | Toast: `"<name> created"`. Append to table or refetch. |
| Email already in use | 409 | `CONFLICT` | Inline form error on email field. |
| Email domain not allowed | 403 | `EMAIL_DOMAIN_NOT_ALLOWED` | Inline form error: `"Only office domains can be added."` |
| Password < 8 chars / missing field | 422 | `VALIDATION_ERROR` | Map `details[].path` to field-level errors. |
| Caller is not admin | 403 | `FORBIDDEN` | Should be unreachable if UI is gated; show generic toast. |

**Initial password**: admin sets it. There is no email invite, no "send setup link", no admin-triggered password reset endpoint. Communicate the password to the new user out-of-band. (Future: better-auth supports a reset flow; not wired yet.)

### Disable / re-enable — scenarios

`PATCH /api/v1/users/:id/disabled` with `{ "disabled": true | false }`.

| Outcome | HTTP | Code | Notes |
|---|---|---|---|
| Disabled successfully | 200 | — | Effective on the user's **next request** (cookie cache is off). |
| Re-enabled | 200 | — | Same — next request succeeds. |
| Already in target state | 200 | — | No-op; backend skips the write. |
| Admin tries to disable self | 400 | `BAD_REQUEST` | UI: never render the toggle for the current user; backend is the safety net. |
| Admin tries to disable a non-existent id | 404 | `NOT_FOUND` | Stale list — refetch. |

**What happens to a disabled user's existing session**: the session cookie is **not** revoked server-side. Their next API call is rejected with `403 ACCOUNT_DISABLED` by the `authenticate` middleware. The FE should treat `403 ACCOUNT_DISABLED` as "log out + redirect to /login with a banner: 'Your account has been disabled. Contact your admin.'".

### Role change — scenarios

`PATCH /api/v1/users/:id/roles` with `{ "roles": ["user"] }` or `{ "roles": ["user", "admin"] }`.

The body **replaces** the entire role set — it is not a delta. To promote a `user` to admin, send `["user", "admin"]` (keep the base role); to demote, send `["user"]`.

| Outcome | HTTP | Code | Notes |
|---|---|---|---|
| Roles updated | 200 | — | |
| No-op (same set) | 200 | — | Backend short-circuits the write. |
| Empty `roles` array | 422 | `VALIDATION_ERROR` | At least one role required. |
| Unknown role | 422 | `VALIDATION_ERROR` | Only `user`, `admin` accepted today. |
| Admin tries to remove their **own** admin role | 400 | `BAD_REQUEST` | Lockout protection. UI: disable the role toggle on the row that matches the current user. |
| Target user not found | 404 | `NOT_FOUND` | Refetch list. |

**No "last admin" guard exists** — an admin *can* demote another admin even if it makes themself the last admin. The self-demote guard is what guarantees the system always has at least one admin.

### Auto-provisioned users (Google sign-in)

A new Google sign-in from an allowed domain auto-creates a user with `roles: ['user']`, `disabled: false`. They appear in the admin Users list immediately. To make them an admin, use the role-change endpoint.

### Limitations

UI must NOT offer these — backend has no endpoint for them:

- ❌ Edit user `name` or `email` after creation
- ❌ Hard-delete a user (only soft-disable is supported)
- ❌ Admin-triggered password reset
- ❌ Bulk actions (bulk-disable, bulk-delete, bulk-role-change)
- ❌ Filter list by `disabled` flag (filter client-side instead)
- ❌ `emailVerified` is currently always `false` for admin-created users (no verification flow wired). Don't rely on this field.

### UI gating recommendation

Route-level: redirect non-admins away from `/admin/users` on mount.

```ts
const { user } = useAuth();
if (!user?.roles.includes('admin')) return <Navigate to="/" replace />;
```

Per-row inside the table:
- Hide the "disable" and "role change" controls **on the current user's own row** (the backend will 400 anyway, but cleaner UX).
- For pending operations, optimistic-update the row and roll back on error.

## Visibility rule — non-admin default filter

Non-admin callers on `GET /products` and `GET /products/:id` are **silently** locked to `status='published'`:

- `?status=archived` as a non-admin → ignored, returns only published.
- `GET /products/:id` for a non-published product as a non-admin → **404** (backend does not leak existence).

UI implication: gate the status filter dropdown off `isAdmin`. Don't render "archived" / "pending_review" options for non-admins.

## Product shape notes

The product doc follows **course-data-schema v19.0.0**. Top-level fields (`id`, `status`, `createdAt`, `updatedAt`) are guaranteed; everything else is nested and validated loosely (`.loose()`), so fields may be missing on partially extracted docs. Use optional chaining everywhere.

Typical table column → path:

| Column | Path |
|---|---|
| Institution | `institution_details.institution_name` |
| Course | `course_details.course_name` |
| Country | `institution_details.country` |
| Study area | `course_details.study_area` |
| Study level | `course_level.study_level` |
| Qualification | `course_level.qualification_type` |
| Status | `status` |
| Updated | `updatedAt` |

**Filter dropdowns**: populate from `GET /products/filters`, never hardcode. The endpoint returns distinct facet values across all (visible) products.

## RBAC gating in UI

```ts
const { user } = useAuth();
const isAdmin = user?.roles.includes('admin') ?? false;
```

Use `isAdmin` to hide admin-only UI (Delete buttons, Users nav item, status filter options, create/edit forms). Backend enforces the same rules — UI gating is UX only. If checks drift, backend still returns 401/403.

## Rate limiting

Global limiter is on. Debounce search/filter inputs ≥ 300ms; don't fire `/products` on every keystroke.

## Known gaps / coming changes

Coordinate with backend before building for these:

- **Google OAuth** is shipped. Domain allowlist (`ALLOWED_EMAIL_DOMAINS`) gates every sign-up path; rejection comes back as 403 `EMAIL_DOMAIN_NOT_ALLOWED`. See [Google sign-in](#google-sign-in).
- **Two-tier roles** (`user` / `admin`) is shipped. `user` can POST/PATCH products (not delete); `admin` can do everything. There is no `editor` / `viewer` distinction.
- **User `disabled` flag** is shipped. See [User management](#user-management).

## Frontend-requested backend follow-ups

Surfaced while wiring each feature branch. Not blocking current work, but each one lets us delete a frontend workaround.

### Open

- **OpenAPI spec hygiene**. Two issues that break `openapi-typescript`'s strict output:
  - Duplicate `operationId: getSession` on GET + POST `/api/auth/get-session`.
  - Missing `operationId` on every `/api/v1/*` operation (generator collides them under `?`).
  Until fixed, [schema.gen.ts](../src/shared/lib/api/schema.gen.ts) carries `@ts-nocheck` and we only consume `components["schemas"]`.
- **Fees filter on `GET /products`**. PRD mentions fees range filtering; backend doesn't expose it yet. Not blocking listing work.
- **Disabled-flag filter on `GET /api/v1/users`** — needed if we want a "Disabled users" tab without fetching the full list and filtering client-side.
- **Edit-user endpoint** (`PATCH /api/v1/users/:id`) for `name` / `email` updates.
- **Admin-triggered password reset** for users who forgot their initial password.

### Closed (shipped)

- **Admin user-create endpoint** (`POST /api/v1/users`) — admin can now create users with email + password + roles. Replace `/signup` with this flow when convenient.
- **Two-tier RBAC** (`user` / `admin`) with `user` permitted to POST/PATCH products (DELETE stays admin-only). PRD's "can do everything except delete" user is the `user` role.
- **User `disabled` flag** + `PATCH /api/v1/users/:id/disabled` — soft-ban with immediate effect on next request (cookie cache off). See [User management](#user-management).
- **Role-change endpoint** (`PATCH /api/v1/users/:id/roles`) with self-demotion guard.
- **Multi-value filters** on `GET /products` — `country`, `institution`, `studyArea`, `studyLevel`, `qualificationType` now accept `?key=a&key=b` or CSV. Landed on `feat/product-filters-and-iso-countries`.
- **`GET /api/v1/meta/countries`** — full ISO 3166 list for form country pickers (distinct from `/products/filters` which only returns countries with products).
- **`GET /api/v1/meta/currencies`** — ISO 4217 list (initial: USD/EUR/GBP/AUD/CAD/NZD).
- **ISO validation on product create/update** — `institution_details.institution_locations[].country` must match the ISO list; returns 422 with Zod path on failure.
