# Data Access Layer System Plan

## Context

The starter currently exposes a thin Axios wrapper ([`apiRequest<T>` at src/shared/lib/api/client.ts:58-71](../src/shared/lib/api/client.ts)) for API calls. That's fine for one app, but Heubert backends are **NestJS** and this starter is used for new apps and migrations alike. Every team re-implementing error parsing, form-field mapping, query keys, Zod validation, and invalidation patterns is waste. "Ready to build" means the boring infrastructure is done on day one — developer clones the starter, points at a NestJS backend, starts shipping features.

**Prior art.** The team has a working DAL in `quickstart-to-launch-pro/src/dal/` (Next.js): endpoint-descriptor + `apiAction` + discriminated `ApiResult<T>`, never throws, optional Zod validation, handles 400 field errors, supports blobs and FormData. This plan ports those **ideas** — not the Next.js specifics — and layers on current TanStack Query + Zod community consensus.

**What research confirms (2025-2026 consensus).**
- **Query Options Factory** (TkDodo / official TanStack v5): hierarchical query-key factory + `queryOptions()` co-locating key and fn. Eliminates custom hook wrappers; works with `useQuery`, `useSuspenseQuery`, `prefetchQuery`, `setQueryData`, `invalidateQueries`.
- **Schema-as-DTO** (Karamuth, Polvara, mlm.dev): Zod schemas are the only type definition. Raw API schema + `.transform()` into camelCase DTO. Validation runs in the `queryFn`; parse errors throw, TanStack's `isError` lights up.
- **Anti-patterns to avoid**: return-only generics (`axios.get<User>()`), hand-written response interfaces that drift from backend reality, custom wrapper hooks per endpoint.

**What top-tier companies do differently.** FAANG and schema-first shops (Stripe, Shopify) codegen their client from OpenAPI/GraphQL. NestJS emits OpenAPI for free via `@nestjs/swagger`, so codegen is a natural evolution — but **deferred to a follow-up plan** (see "Out of scope"). The DAL structure here is explicitly codegen-ready: when codegen lands, it drops `endpoints.ts` + Zod schemas into a `.generated/` folder without disturbing the `queries.ts` / hooks layer above.

Sources: [TanStack Query — Query Options](https://tanstack.com/query/v5/docs/react/guides/query-options), [TkDodo — The Query Options API](https://tkdodo.eu/blog/the-query-options-api), [TkDodo — Type-safe React Query](https://tkdodo.eu/blog/type-safe-react-query), [Karamuth — Stop Trusting Your API](https://joshkaramuth.com/blog/tanstack-zod-dto/).

## Design principles

1. **The schema is the type.** Every response goes through Zod. TS types inferred via `z.infer`. No hand-written `interface User`.
2. **The core executor never throws.** `apiFetch()` always returns `ApiResult<T>`. Hook wrappers throw so TanStack Query's `isError` fires.
3. **Endpoint descriptors, not string URLs.** A typed `ApiEndpoint` co-locates path, method, stable key.
4. **No custom hook wrappers per endpoint.** Query Options Factory: `useQuery(userQueries.list(filters))`, not `useUsersList(filters)`.
5. **Feature co-location.** Each feature owns its `endpoints.ts`, `schemas/*.ts`, `queries.ts`. No global API registry.
6. **Graceful degradation.** Features drop to raw `apiFetch` or raw `apiClient` when the abstraction doesn't fit.
7. **NestJS-aware defaults.** The starter targets NestJS; bake its conventions in, don't make every project re-wire them.
8. **Compose with DataTable, don't replace it.** DataTable's `DataProvider` stays; both systems share `apiClient`.
9. **Not over-engineered.** Hard line-count budget (see below). If a helper can't pay for itself in <50 lines, it's a doc pattern, not code.

## Architecture — four layers

### Layer 1 — HTTP transport (unchanged)

The existing Axios instance at [src/shared/lib/api/client.ts](../src/shared/lib/api/client.ts) stays put. The DAL uses it internally. **Known auth-adjacent issue** (for the future auth plan, not this PR): the bearer-token-from-localStorage interceptor at lines 25-34 is misaligned with `better-auth` (used in the Heubert backend starter), which defaults to httpOnly cookie sessions. The auth plan will drop that interceptor and add `withCredentials: true`. The DAL is transport-agnostic and unaffected either way.

### Layer 2 — Executor (`apiFetch`)

A single never-throws function that takes an endpoint descriptor and options, returns `Promise<ApiResult<T>>`. Replaces the current `apiRequest<T>`.

```ts
// src/shared/lib/dal/core/types.ts
export type ApiResult<T> =
  | { success: true;  data: T;          status: number;   message?: string }
  | { success: false; data?: undefined; status?: number;  message: string; errors?: ApiValidationError };

export interface ApiEndpoint {
  key: string;                                          // e.g. 'users.list'
  path: string;                                         // e.g. '/users/{id}'
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; // default GET
}

export interface ApiFetchOptions<TBody = unknown, TData = unknown> {
  body?: TBody;                                         // JSON, FormData, primitive
  pathParams?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  responseType?: 'json' | 'blob' | 'arraybuffer' | 'text';
  schema?: z.ZodType<TData>;
  signal?: AbortSignal;
}

export interface ApiValidationError { [field: string]: string | string[] }

// src/shared/lib/dal/core/apiFetch.ts
export async function apiFetch<TData = unknown, TBody = unknown>(
  endpoint: ApiEndpoint,
  options?: ApiFetchOptions<TBody, TData>,
): Promise<ApiResult<TData>>;
```

**Behavior:**
- Never throws — all failures surface via `{ success: false, ... }`.
- Optional `schema` validates response; parse failure → `{ success: false, message: 'Received invalid data format', status }`.
- `FormData` body passed through untouched (multipart uploads).
- `responseType` override for blobs/text/arraybuffer.

**Pluggable error parser with NestJS default** (~15 lines config + ~20 per parser):

The core of `apiFetch` stays backend-agnostic. Error-shape parsing is a small configured hook:

```ts
// src/shared/lib/dal/core/config.ts (~15 loc)
export type ErrorParser = (err: AxiosError) => {
  message: string;
  status?: number;
  errors?: ApiValidationError;
};

let activeParser: ErrorParser = nestJsErrorParser;
export function configureDal(cfg: { errorParser?: ErrorParser }): void;
export function getErrorParser(): ErrorParser;
```

Two built-in parsers ship in v1:

- **`nestJsErrorParser`** (default). Handles `HttpException` bodies `{ statusCode, message, error }`. When `message: string[]` (class-validator), parses each `"field must be..."` line and lifts onto `errors: { [field]: string }` with `message = "Validation failed"`. When `message: string`, uses it as-is.
- **`genericErrorParser`**. Handles the common REST convention `{ message, errors: { [field]: string | string[] } }` (Laravel, Rails, many Express shops). `errors` object passes through untouched; `message` is used as-is.

Both fall back to `axiosError.message` when the body doesn't match — nothing crashes on an unexpected shape.

**For non-NestJS backends**, one line at app bootstrap switches the default:
```ts
// src/app/main.tsx or similar
configureDal({ errorParser: genericErrorParser });
```

No per-call plumbing, no wrapping `apiFetch`. The whole DAL works identically; only the error adapter swaps.

Rationale: the starter targets Heubert's NestJS backends by default, but one config line makes it genuinely useful against any backend with a structured error body. Writing a third parser (Django, FastAPI) is ~20 lines and belongs in the consuming project's code — documented pattern, not shipped.

**Renames from reference DAL (match repo conventions):**

| Quickstart DAL     | Starter DAL     |
|--------------------|-----------------|
| `apiAction`        | `apiFetch`      |
| `controllerName`   | `path`          |
| `queryKeyName`     | `key`           |
| `requestMethod`    | `method`        |
| `requestData`      | `body`          |
| `pathVariables`    | `pathParams`    |
| `params` (query)   | `query`         |
| `responseSchema`   | `schema`        |

Dropped: `revalidatePath`, `React.cache`, `dbAction` (Next.js-specific).

### Layer 3 — Query Options Factory (per feature, documented pattern)

Each feature's `queries.ts` uses TanStack's `queryOptions()` + hierarchical key factory:

```ts
// src/features/users/api/queries.ts
import { queryOptions } from '@tanstack/react-query';
import { apiFetch, unwrap } from '@shared/lib/dal';
import { userEndpoints } from './endpoints';
import { UserSchema, UserListSchema } from '../schemas/user.schema';

export const userQueries = {
  all:     () => ['users'] as const,
  lists:   () => [...userQueries.all(), 'list'] as const,
  list:    (filters?: UserFilters) => queryOptions({
    queryKey: [...userQueries.lists(), filters ?? {}] as const,
    queryFn: ({ signal }) =>
      unwrap(apiFetch(userEndpoints.list, { query: filters, schema: UserListSchema, signal })),
  }),
  details: () => [...userQueries.all(), 'detail'] as const,
  detail:  (id: string) => queryOptions({
    queryKey: [...userQueries.details(), id] as const,
    queryFn: ({ signal }) =>
      unwrap(apiFetch(userEndpoints.one, { pathParams: { id }, schema: UserSchema, signal })),
  }),
};
```

Consumers:
```ts
const { data } = useQuery(userQueries.list(filters));
const user = useSuspenseQuery(userQueries.detail(id)).data;
queryClient.invalidateQueries({ queryKey: userQueries.all() });
queryClient.prefetchQuery(userQueries.detail(id));
```

**This is a pattern, not a framework** — no code to maintain in `shared/lib/dal/`. `queries.ts` files are hand-written per feature. `unwrap` is the only library piece:

```ts
// src/shared/lib/dal/react/unwrap.ts (~5 lines)
export async function unwrap<T>(p: Promise<ApiResult<T>>): Promise<T> {
  const r = await p;
  if (r.success) return r.data;
  throw new ApiError(r);
}
```

### Layer 4 — Hooks and helpers

Four small pieces, each doing one thing:

**`useApiMutation`** — 80% mutation case (submit → auto-invalidate). Target ~40 lines.
```ts
const createUser = useApiMutation(userEndpoints.create, {
  schema: UserSchema,
  invalidateKeys: [userQueries.all()],
});

createUser.mutate({ body: formValues }, {
  onError: (err) => applyApiErrorToForm(form, err),
});
```
Complex cases (optimistic, multi-step, custom `onMutate`) drop to raw `useMutation` + `apiFetch`. Documented escape hatch.

**`applyApiErrorToForm(form, err)`** — RHF integration. Target ~15 lines.
```ts
// src/shared/lib/dal/react/applyApiErrorToForm.ts
export function applyApiErrorToForm(
  form: UseFormReturn<FieldValues>,
  err: ApiError,
): void {
  if (!err.errors) return;
  for (const [field, message] of Object.entries(err.errors)) {
    form.setError(field, { message: Array.isArray(message) ? message[0] : message });
  }
}
```
Every form that submits through `useApiMutation` gets field-level 400 errors populated in one line.

**Global toast on unhandled errors** — Sonner wiring on `queryClient`. Target ~15 lines.
```ts
// src/shared/lib/query/client.ts (extends existing)
queryClient.setMutationDefaults(['__fallback__'], { onError: /* toast */ });
queryClient.getQueryCache().config = {
  onError: (err) => {
    if (err instanceof ApiError) toast.error(err.message);
  },
};
```
Fires only when a component didn't handle the error itself (TanStack's default behavior — component `onError` suppresses the global). Catches the "forgot to handle" case; explicit handlers win.

**`ApiError` class** — ~15 lines.
```ts
// src/shared/lib/dal/core/errors.ts
export class ApiError extends Error {
  readonly status?: number;
  readonly errors?: ApiValidationError;
  constructor(result: Extract<ApiResult<unknown>, { success: false }>) {
    super(result.message);
    this.name = 'ApiError';
    this.status = result.status;
    this.errors = result.errors;
  }
}
```

## File layout

```
src/shared/lib/dal/
├── core/
│   ├── types.ts                # ApiEndpoint, ApiResult, ApiFetchOptions, ApiValidationError (~30 loc)
│   ├── errors.ts               # ApiError (~15 loc)
│   ├── apiFetch.ts             # executor (~60 loc — parser lives in parsers/)
│   ├── config.ts               # configureDal + getErrorParser (~15 loc)
│   ├── path.ts                 # interpolatePath (~10 loc)
│   └── index.ts
├── parsers/
│   ├── nestjs.ts               # nestJsErrorParser (~25 loc, default)
│   ├── generic.ts              # genericErrorParser — { message, errors } shape (~20 loc)
│   └── index.ts
├── react/
│   ├── unwrap.ts               # ~5 loc
│   ├── useApiMutation.ts       # ~40 loc
│   ├── applyApiErrorToForm.ts  # ~15 loc
│   └── index.ts
└── index.ts                    # barrel
```

**Engine line-count budget: ~240 lines of code.** If a file exceeds its target by >30%, stop and reconsider — the abstraction is carrying more than it should.

**Feature convention (documented, not scaffolded):**
```
src/features/<feature>/
├── api/
│   ├── endpoints.ts        # hand-written now; codegen target in follow-up plan
│   ├── queries.ts          # Query Options Factory
│   └── .generated/         # reserved — empty until codegen plan lands
├── schemas/
│   └── <resource>.schema.ts   # Zod schemas, raw + DTO via .transform()
└── ...
```

**Replaces:** `apiRequest<T>` export from [src/shared/lib/api/client.ts](../src/shared/lib/api/client.ts#L58-L71). `apiClient` (axios instance) stays and becomes an internal dependency of `apiFetch`.

## Relation to existing systems

- **DataTable**: `DataProvider` + middleware + `createAxiosProvider` stay put in `src/shared/lib/data-table/`. Both systems share `apiClient`. Features can drive a DataTable from a DAL query via `mode: "server"` + custom `queryFn` calling `apiFetch`.
- **Legacy `queryKeys` factory** at [src/shared/lib/query/client.ts:32-47](../src/shared/lib/query/client.ts): superseded by per-feature Query Options Factories. No migration in this PR.

## Implementation phases (single PR)

### Phase A — DAL core + tests
- Create `src/shared/lib/dal/` with files above, including `parsers/nestjs.ts` (default) and `parsers/generic.ts`.
- First real Vitest suite in the repo — establishes the test template for future features. Cover:
  - `apiFetch`: success/failure/Zod validation/FormData/blob/path interpolation.
  - `nestJsErrorParser`: string `message`, `string[]` (class-validator) → field errors, non-NestJS shape fallback.
  - `genericErrorParser`: `{ message, errors: {...} }` passthrough, fallback.
  - `configureDal`: swapping the parser changes `apiFetch` error output on the next call.
  - `unwrap` throws `ApiError`; `useApiMutation` invalidation + error surface; `applyApiErrorToForm` populates RHF.

### Phase B — Demo feature
- `src/features/demo-dal/` against DummyJSON (`/users`, `/posts`):
  - `api/endpoints.ts` — list, one, create, update, delete.
  - `schemas/` — Zod schemas with one `.transform()` snake→camel to demonstrate DTO.
  - `api/queries.ts` — full Query Options Factory.
  - Route: list (`useQuery`), detail (`useSuspenseQuery`), create form showing `applyApiErrorToForm` (simulated 400), delete via raw `useMutation` (escape-hatch demo).

### Phase C — Migrate existing callers
- Grep `apiRequest` in `src/`; migrate to `apiFetch`. Expected blast radius is small (DataTable has its own path).

### Phase D — Docs
- New: `docs/data-access-layer.md` — conventions, form-error pattern, NestJS default + how to swap to `genericErrorParser` (or write a custom one for Django/FastAPI), escape-hatch guidance, "add a new resource" walkthrough.
- Update: `docs/architecture.md` — one paragraph + link to DAL doc.

## Out of scope (follow-up plans)

- **OpenAPI codegen** — deferred. Requires a real Heubert NestJS backend to validate against; demo can't exercise it. Convention locked in now (`.generated/` folder), tooling (`@hey-api/openapi-ts`) added when first real backend lands. Plan: `plans/OpenAPICodegenPlan.md` later.
- **Auth feature** — `better-auth` client integration, protected routes, session → user-store wiring. Drops the existing bearer-token-in-localStorage interceptor, adds `withCredentials: true`. Plan: `plans/AuthFeaturePlan.md` later.
- **Pagination helpers + DataTable bridge** — `usePaginatedQuery` matching `nestjs-paginate`'s shape; document how DataTable `mode: "server"` consumes it. Plan: `plans/PaginationPlan.md` later.
- **i18n, CI/CD, observability** — independent of DAL, separate plans.
- **Optimistic update helpers, GraphQL executor, retiring legacy `queryKeys.users`, removing Axios** — not justified yet; add when a concrete need appears.

## Verification

1. `bun run typecheck` — all old `apiRequest` call sites migrated; DAL compiles.
2. `bun run lint` — Biome green (100-char line width, import ordering from [biome.json](../biome.json)).
3. `bun run test` — Vitest green. First test file in the repo; pattern is the template.
4. `bun run dev`, open `/demo-dal`:
   - List renders; filters reflected in query key; refetch on filter change.
   - Detail suspends, renders via `useSuspenseQuery`.
   - Create form: happy path works; simulate NestJS-shaped 400 → field errors populate via `applyApiErrorToForm`.
   - Delete removes row; list re-fetches via `invalidateKeys`.
   - Tamper with a response in DevTools → Zod catches the drift → `isError` + toast fires.
   - Network tab shows existing `apiClient` interceptors reached.
5. `/demo-table` (existing) unchanged — regression check.
6. "Add a new resource" walkthrough in [docs/data-access-layer.md](../docs/data-access-layer.md) completes end-to-end against a different DummyJSON endpoint (e.g. `/carts`) in **under 10 minutes**. If longer, the abstraction is too heavy — trim before merge.
7. **Line-count budget check**: engine under ~225 LOC total. If exceeded by >30%, reconsider before merge.
