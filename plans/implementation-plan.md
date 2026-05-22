# Product Portal Frontend — Master Implementation Plan

Single source of truth for what we're building, why, and how it integrates with the backend. Read this before writing code.

---

## 1. Context

Product Portal — a React frontend for managing educational courses (MBA, BBA, Certificates, etc.). Built on the Heubert starter (TanStack Router/Query/Table, shadcn/ui, Zustand, Tailwind v4, Biome, Vite).

### Architecture Decisions (locked in)

- **New dedicated backend** being built in parallel at `/home/jenish/Projects/heubert/product-portal-backend` by a separate Claude session (does not exist yet)
- **Fresh API design** — not reusing Atlas conventions
- **Mongoose + MongoDB** — single database, no dual-source merge
- **Real JWT auth** — seeded PRD users with bcrypt-hashed passwords
- **Single-tenant** — no `x-tenant-id` header
- **PRD data shape** — follows PRD spec exactly (name, institution, country, studyArea, studyLevel, branches, entryRequirements, intakes, status)
- **Contract-first** — this document is the spec both Claude sessions implement against

### What Already Exists (keep as-is)

- Design system: Linear-inspired OKLCh tokens, Inter font, Layout primitives
- Route structure: `/`, `/login`, `/_authenticated/*`
- Landing page + Navbar + ThemeToggle + ThemeGenerator
- Login page (UI only — needs auth rewired)
- Authenticated layout with AppSidebar
- Product listing with DataTable (columns/card/actions/bulk) — UI complete, wired to DummyJSON
- Permissions hook + user store + auth rehydration

### What Becomes Obsolete (delete)

| File/folder | Why |
|---|---|
| `src/shared/lib/auth/credentials.ts` | Hardcoded auth replaced by real JWT |
| `src/features/products/api/product-mapper.ts` | DummyJSON mapper no longer needed |

---

## 2. Cleanup Step (execute first)

```bash
rm src/shared/lib/auth/credentials.ts
rm src/features/products/api/product-mapper.ts
rmdir src/shared/lib/auth 2>/dev/null || true
```

---

## 3. API Contract (the shared spec)

> **This is the single source of truth.** Both frontend and backend Claude sessions implement against this. Any change happens here first.

### 3.1 Base Configuration

| Property | Value |
|---|---|
| Base URL (dev) | `http://localhost:3000` |
| Base URL (prod) | TBD by backend team |
| Content-Type | `application/json` |
| Auth | `Authorization: Bearer {jwt}` on all non-auth endpoints |
| CORS | Allow `http://localhost:5173` in dev |

### 3.2 Error Response Shape (all errors)

```typescript
interface ApiError {
  success: false;
  status: number;       // HTTP status
  message: string;      // User-facing
  code?: string;        // Machine-readable error code (e.g. "INVALID_CREDENTIALS")
  details?: unknown;    // Validation errors (field → message map)
}
```

Standard HTTP statuses: 400 (validation), 401 (unauthenticated), 403 (forbidden), 404 (not found), 409 (conflict), 422 (semantic validation), 500 (server).

### 3.3 Success Response Shapes

**Single resource:**
```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
}
```

**Paginated list:**
```typescript
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;         // 1-indexed
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 3.4 Data Models

```typescript
// ─── User ───
type UserRole = "admin" | "user";

interface User {
  id: string;            // Mongo ObjectId as string
  email: string;
  name: string;
  role: UserRole;        // "admin" = superadmin, "user" = basic user
  createdAt: string;     // ISO 8601
  updatedAt: string;
}

// ─── Product (PRD shape) ───
type StudyLevel = "undergraduate" | "postgraduate" | "certificate" | "diploma";
type ProductStatus = "active" | "disabled";

interface BranchLocation {
  id: string;
  name: string;          // "Sydney", "Kathmandu"
  country: string;
  address?: string;
}

interface EntryRequirement {
  examName: string;      // "IELTS", "TOEFL", "CAE/C1 Advanced", "CPE/C2 Proficiency", "CAEL", "OET"
  overallScore: number;
  minimumBandScores?: {
    reading?: number;
    writing?: number;
    listening?: number;
    speaking?: number;
  };
  recognized: boolean;   // false = don't display (e.g. CAEL/OET at Massey)
}

interface Product {
  id: string;
  name: string;                  // "Master of Business Administration"
  code: string;                  // "MBA-2024"
  institution: string;           // "Massey University"
  country: string;
  studyArea: string;             // "Business & Management"
  studyLevel: StudyLevel;
  duration: string;              // "2 years"
  fees: number;                  // annual fees (number)
  currency: string;              // "NZD", "USD", "AUD"
  description: string;
  branches: BranchLocation[];
  entryRequirements: EntryRequirement[];
  intakes: string[];             // ["February", "July"]
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Filter options (for faceted filters) ───
interface FilterOptions {
  countries: string[];
  institutions: string[];
  studyAreas: string[];
  studyLevels: StudyLevel[];
}
```

### 3.5 Endpoints

#### Auth

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/api/auth/login` | No | `{ email, password }` | `ApiResponse<{ user: User, token: string }>` |
| POST | `/api/auth/logout` | Yes | — | `ApiResponse<null>` |
| GET | `/api/auth/me` | Yes | — | `ApiResponse<User>` |

**Login validation:**
- `email` required, valid email
- `password` required, min 1 char
- 401 if credentials don't match
- Response `token` is a JWT with `{ sub: userId, role, iat, exp }` payload, 7-day expiry

**Seed users** (backend creates on startup):

| Email | Password (plain → bcrypt) | Role | Name |
|---|---|---|---|
| `user@experteducation.com` | `user123` | `user` | Basic User |
| `superadmin@experteducationc.com` | `admin123` | `admin` | Super Admin |

#### Products

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/products` | Yes | any | List products, paginated, searchable, filterable |
| GET | `/api/products/:id` | Yes | any | Single product |
| POST | `/api/products` | Yes | any | Create product |
| PUT | `/api/products/:id` | Yes | any | Update product |
| PATCH | `/api/products/:id/status` | Yes | any | Toggle active/disabled |
| DELETE | `/api/products/:id` | Yes | **admin** | Delete single |
| POST | `/api/products/bulk-delete` | Yes | **admin** | `{ ids: string[] }` |
| POST | `/api/products/import` | Yes | any | `{ products: Product[] }` bulk insert |
| GET | `/api/products/export` | Yes | any | `?format=csv\|json&...filters` — file download |
| GET | `/api/products/filters` | Yes | any | `ApiResponse<FilterOptions>` — for faceted filters |

**List query parameters:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | number | 1 | 1-indexed |
| `limit` | number | 20 | Max 100 |
| `search` | string | — | Search across name, code, institution, description |
| `country` | string | — | Exact match, repeatable |
| `institution` | string | — | Exact match, repeatable |
| `studyArea` | string | — | Exact match, repeatable |
| `studyLevel` | string | — | Enum, repeatable |
| `feeMin` | number | — | Inclusive |
| `feeMax` | number | — | Inclusive |
| `status` | string | `active` for role=`user`, all for `admin` | Filter by status |
| `sortBy` | string | `createdAt` | Field to sort by |
| `order` | string | `desc` | `asc` or `desc` |

**Create/Update validation** (both enforce server-side):
- Required: name, code, institution, country, studyArea, studyLevel, duration, fees, currency, description
- `fees > 0`
- `studyLevel` must be one of the enum values
- `status` defaults to `"active"` on create
- PUT cannot rename existing branches (match by `branch.id`) — new branches (no `id`) are additions
- Return 422 with `details: { fieldName: "error message" }` on validation failure

**Delete behaviors:**
- Single delete returns `ApiResponse<null>` on 204-equivalent success (use 200)
- Bulk delete returns `ApiResponse<{ deleted: number; failed: string[] }>`

### 3.6 Auth/Permission Matrix (server-enforced)

| Action | Basic User | Superadmin |
|---|---|---|
| Login | ✅ | ✅ |
| List products | ✅ (active only by default) | ✅ (all) |
| View product | ✅ | ✅ |
| Create product | ✅ | ✅ |
| Update product | ✅ | ✅ |
| Toggle status | ✅ | ✅ |
| Delete single | ❌ (403) | ✅ |
| Bulk delete | ❌ (403) | ✅ |
| Import CSV/JSON | ✅ | ✅ |
| Export | ✅ | ✅ |

Backend enforces via JWT `role` claim + middleware guard on restricted endpoints.

---

## 4. Implementation Steps

### Step 1 — Clean up obsolete files

Execute the cleanup from §2.

### Step 2 — Environment config

**Modify `.env`:**
```
VITE_API_URL=http://localhost:3000
```

**Modify `.env.example`:** same.

### Step 3 — Axios client audit

**Modify `src/shared/lib/api/client.ts`:**
- Verify base URL reads from `VITE_API_URL` (already does)
- Remove `x-tenant-id` header if present (single-tenant)
- Keep the Bearer token interceptor (reads from `localStorage.auth_token`)
- Keep the 401 handler (dispatches `auth:unauthorized` event)

### Step 4 — Real auth

**Delete `src/shared/lib/auth/credentials.ts`.**

**Rewrite `src/features/auth/api/use-login.ts`:**
```typescript
// POST /api/auth/login → { user, token }
// onSuccess: store token + user in localStorage, setUser(user), navigate to /products
```

**`src/features/auth/lib/auth.schema.ts`** — no change (email + password already).

**Modify `src/shared/stores/user-store.ts`:**
- On logout, also call `POST /api/auth/logout` (fire-and-forget) for backend session cleanup
- Existing rehydration from localStorage continues to work

**Wire `auth:unauthorized` event listener** (maybe in `__root.tsx` or a separate effect) to trigger `useUserStore.getState().logout()` + redirect to `/login`.

### Step 5 — Product types (rewrite to PRD shape)

**Rewrite `src/features/products/types/product.types.ts`** — use the types from §3.4 exactly. Delete `DummyJsonProduct` and `DummyJsonProductsResponse`.

### Step 6 — Products service (real API)

**Rewrite `src/features/products/api/products.service.ts`:**

```typescript
import { apiClient } from "@shared/lib/api/client";
import type { Product, FilterOptions } from "../types/product.types";

export interface ProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string[];
  institution?: string[];
  studyArea?: string[];
  studyLevel?: string[];
  feeMin?: number;
  feeMax?: number;
  status?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export async function getProducts(params: ProductsParams) { /* GET /api/products */ }
export async function getProduct(id: string) { /* GET /api/products/:id */ }
export async function createProduct(data: Omit<Product, "id"|"createdAt"|"updatedAt">) { /* POST /api/products */ }
export async function updateProduct(id: string, data: Partial<Product>) { /* PUT /api/products/:id */ }
export async function toggleProductStatus(id: string, status: "active"|"disabled") { /* PATCH /api/products/:id/status */ }
export async function deleteProduct(id: string) { /* DELETE /api/products/:id */ }
export async function bulkDeleteProducts(ids: string[]) { /* POST /api/products/bulk-delete */ }
export async function importProducts(products: Product[]) { /* POST /api/products/import */ }
export async function exportProducts(filters: ProductsParams, format: "csv"|"json") { /* GET /api/products/export → blob */ }
export async function getFilterOptions(): Promise<FilterOptions> { /* GET /api/products/filters */ }
```

**Delete `src/features/products/api/product-mapper.ts`** (no mapping needed — backend returns PRD shape directly).

### Step 7 — Query hooks

**Modify `src/features/products/api/use-products.ts`:**
- Update signatures to match new service
- Add `useProductFilters()` querying `getFilterOptions`
- Add `useUpdateProduct`, `useToggleProductStatus`, `useImportProducts`, `useExportProducts`
- All mutations invalidate `queryKeys.products.all`

### Step 8 — DataTable columns (PRD fields)

**Modify `src/features/products/lib/columns.tsx`:**
- Replace columns with PRD fields: name (+ institution subtitle), country, studyArea, studyLevel (badge), fees (currency-formatted), status (badge), actions
- Remove DummyJSON-specific columns (price, stock, rating, thumbnail)

**Modify `src/features/products/components/ProductCard.tsx`:**
- Show name, institution, country, studyLevel badge, fees, status badge

**Modify `src/features/products/ProductListingPage.tsx`:**
- Swap `createRestProvider` → use `createAxiosProvider(apiClient)` from `@shared/lib/data-table`
- Point resource at `/api/products`
- Filter options load via `useProductFilters()` instead of DummyJSON categories
- Status filter: basic user defaults to `active`, superadmin sees toggle for all
- URL query params match server: `page`, `limit`, `search`, `country[]`, etc.

### Step 9 — Route-level data prefetch (optional polish)

In `src/app/routes/_authenticated/products/index.tsx`:
- Add `loader` that prefetches `useProducts` default query via `queryClient.ensureQueryData`

### Step 10 — Verification

Run locally:
1. Backend up on `:3000`
2. `bun dev` on `:5173`
3. Visit `/login` → sign in as `user@experteducation.com` / `user123` → lands on `/products`
4. Products table loads real data, pagination works, search triggers server query, filters apply
5. Sort by column works
6. Try delete action → hidden (basic user doesn't have `canDelete`)
7. Logout → login as superadmin → Delete/Bulk Delete visible, DELETE confirmation works
8. Invalidate token manually (DevTools → localStorage → remove `auth_token`) → next request → redirected to `/login`
9. `bun run type-check` + `bun run build` + `bun run lint` — all pass

---

## 5. Files Inventory

### To Delete
- `src/shared/lib/auth/credentials.ts`
- `src/shared/lib/auth/` (entire folder if empty after)
- `src/features/products/api/product-mapper.ts`

### To Modify
- `.env` — confirm `VITE_API_URL`
- `.env.example` — mirror
- `src/shared/lib/api/client.ts` — drop `x-tenant-id` if present
- `src/shared/stores/user-store.ts` — optional backend logout call
- `src/app/routes/__root.tsx` — wire `auth:unauthorized` listener (or separate effect)
- `src/features/auth/api/use-login.ts` — real API call
- `src/features/products/types/product.types.ts` — PRD shape
- `src/features/products/api/products.service.ts` — real endpoints
- `src/features/products/api/use-products.ts` — new hooks
- `src/features/products/lib/columns.tsx` — PRD fields
- `src/features/products/components/ProductCard.tsx` — PRD fields
- `src/features/products/ProductListingPage.tsx` — axios provider + filter options hook

### Existing files referenced (read-only utility)
- `src/shared/lib/data-table/` — DT.Root, createAxiosProvider, createSelectionColumn
- `src/shared/lib/query/client.ts` — queryKeys.products
- `src/shared/components/ui/*` — all UI primitives
- `src/shared/hooks/use-permissions.ts` — reads real role now

---

## 6. Coordination with Backend Claude

Backend Claude reads this document as the contract. Both sides commit before code. Any contract change:
1. Update this file
2. Notify both sessions
3. Both adapt

### Backend deliverables (for reference)
- Express + Mongoose project at `/home/jenish/Projects/heubert/product-portal-backend`
- All endpoints in §3.5
- JWT middleware with role guard
- Validation via Zod (or equivalent)
- Seed script that upserts the 2 PRD users on startup
- CORS configured for `http://localhost:5173`

### Frontend deliverables (this plan)
- All steps 1-10 above

---

## 7. Next Phases (unchanged, now achievable with real backend)

- **Phase 3**: Product Detail/Edit + Create pages (form, BranchEditor, EntryRequirements, DisableToggle, delete)
- **Phase 4**: Import/Export (CSV + JSON, drag-drop uploader, preview, filtered export)
- **Phase 5**: Polish (toasts, loading, empty states, responsive, a11y, URL sync, 404)

---

## 8. Verification Summary (end-to-end)

After implementation:
1. ✅ Login as both users, role differences visible
2. ✅ Products listing fetches from `http://localhost:3000/api/products`
3. ✅ Search / filter / sort / pagination all work server-side
4. ✅ Delete actions respect backend 403 for basic user
5. ✅ DELETE confirmation modal blocks bulk/single destructive actions
6. ✅ 401 → auto-logout flow works
7. ✅ `bun run type-check`, `bun run build`, `bun run lint` all pass
