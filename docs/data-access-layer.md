# Data Access Layer (DAL)

> Every API call in every feature flows through the DAL. Typed endpoints, Zod-validated responses, automatic cache invalidation, NestJS error shapes handled by default.

If you only read one section, read [Add a resource in 10 minutes](#add-a-resource-in-10-minutes).

## Why the DAL exists

The default React Query + Axios pattern has each feature re-implement the same five things:

1. Query key strings
2. Response shape (hand-typed interfaces that drift from the backend)
3. Error shape (every backend returns a different 400 body)
4. Form field-error wiring
5. Cache invalidation on mutations

The DAL standardises all five. You define a resource once. The hooks, keys, validation, and invalidation fall out of it.

## The four pieces

```
src/shared/lib/dal/
├── core/
│   ├── apiFetch.ts        ← never-throws executor
│   ├── config.ts          ← configureDal({ errorParser })
│   ├── errors.ts          ← ApiError (thrown by hook bridges)
│   └── types.ts           ← ApiEndpoint, ApiResult, ApiFetchOptions
├── parsers/
│   ├── nestjs.ts          ← default — HttpException + class-validator
│   └── generic.ts         ← { message, errors } — Laravel/Rails/etc.
└── react/
    ├── unwrap.ts          ← ApiResult<T> → T or throw ApiError
    ├── useApiMutation.ts  ← submit + auto-invalidate
    └── applyApiErrorToForm.ts  ← drop 400 field errors into RHF
```

### 1. `apiFetch(endpoint, options)` — the executor

Never throws (except on request cancellation — that's re-thrown so TanStack Query can recognise it). Every outcome comes back as a discriminated `ApiResult<T>`:

```ts
type ApiResult<T> =
  | { success: true;  data: T;          status: number;  message?: string }
  | { success: false; status?: number;  message: string; errors?: ApiValidationError };
```

Usage:

```ts
import { apiFetch } from "@shared/lib/dal";

const result = await apiFetch(userEndpoints.one, {
  pathParams: { id: "42" },
  schema: UserSchema,
});

if (result.success) {
  console.log(result.data);         // typed from UserSchema
} else {
  console.log(result.message);      // always present
  console.log(result.errors);       // field-keyed on validation failures
}
```

Options: `body` (JSON, FormData, or primitive), `pathParams`, `query`, `headers`, `responseType` (`"json" | "blob" | "arraybuffer" | "text"`), `schema` (Zod), `signal`. All optional.

### 2. Query Options Factory — pattern, not code

Each feature owns its queries. No custom hook wrappers per endpoint. Use TanStack's `queryOptions()` on top of a hierarchical key factory:

```ts
// src/features/users/api/queries.ts
import { apiFetch, unwrap } from "@shared/lib/dal";
import { queryOptions } from "@tanstack/react-query";
import { UserListSchema, UserSchema } from "../schemas/user.schema";
import { userEndpoints } from "./endpoints";

export const userQueries = {
  all:     () => ["users"] as const,
  lists:   () => [...userQueries.all(), "list"] as const,
  list:    (filters = {}) => queryOptions({
    queryKey: [...userQueries.lists(), filters] as const,
    queryFn: ({ signal }) =>
      unwrap(apiFetch(userEndpoints.list, { query: filters, schema: UserListSchema, signal })),
  }),
  details: () => [...userQueries.all(), "detail"] as const,
  detail:  (id: number) => queryOptions({
    queryKey: [...userQueries.details(), id] as const,
    queryFn: ({ signal }) =>
      unwrap(apiFetch(userEndpoints.one, { pathParams: { id }, schema: UserSchema, signal })),
  }),
};
```

In components:

```ts
const { data } = useQuery(userQueries.list({ limit: 10 }));
const user   = useSuspenseQuery(userQueries.detail(id)).data;
queryClient.invalidateQueries({ queryKey: userQueries.all() });
queryClient.prefetchQuery(userQueries.detail(id));
```

No `useUsersList` hook. The factory is the abstraction.

### 3. `useApiMutation` — submit + auto-invalidate

```ts
const createUser = useApiMutation(userEndpoints.create, {
  schema: UserSchema,
  invalidateKeys: [userQueries.all()],
  onSuccess: (user) => toast.success(`Created ${user.fullName}`),
  onError:   (err)  => applyApiErrorToForm(form, err),
});

createUser.mutate({ body: formValues });
```

Failures throw a typed `ApiError` with `status`, `message`, and (when present) field-level `errors`. For anything more complex — optimistic updates, multi-step mutations, custom `onMutate` — drop to raw `useMutation` + `apiFetch` (see [Delete escape hatch](#delete-escape-hatch) below).

### 4. `applyApiErrorToForm(form, err)`

One line turns an `ApiError.errors` dictionary into `form.setError(field, …)` calls per field. The "type" is recorded as `"server"` so you can distinguish client vs. server validation errors if ever needed.

## Add a resource in 10 minutes

Imagine we're adding a `posts` resource against `https://api.example.com/posts`.

### Step 1 — schemas

```ts
// src/features/posts/schemas/post.schema.ts
import { z } from "zod";

export const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
});

export const PostListSchema = z.object({
  posts: z.array(PostSchema),
  total: z.number(),
});

export type Post = z.infer<typeof PostSchema>;
```

The schema is the type. Don't write `interface Post` — use `z.infer`.

### Step 2 — endpoints

```ts
// src/features/posts/api/endpoints.ts
import type { ApiEndpoint } from "@shared/lib/dal";

export const postEndpoints = {
  list:   { key: "posts.list",   path: "/posts" } satisfies ApiEndpoint,
  one:    { key: "posts.one",    path: "/posts/{id}" } satisfies ApiEndpoint,
  create: { key: "posts.create", path: "/posts", method: "POST" } satisfies ApiEndpoint,
  update: { key: "posts.update", path: "/posts/{id}", method: "PUT" } satisfies ApiEndpoint,
  remove: { key: "posts.remove", path: "/posts/{id}", method: "DELETE" } satisfies ApiEndpoint,
} as const;
```

`path` is relative — `apiClient`'s `baseURL` prefixes it. Pass a full `https://…` URL if you need to override (the demo hits DummyJSON that way).

### Step 3 — queries factory

```ts
// src/features/posts/api/queries.ts
import { apiFetch, unwrap } from "@shared/lib/dal";
import { queryOptions } from "@tanstack/react-query";
import { PostListSchema, PostSchema } from "../schemas/post.schema";
import { postEndpoints } from "./endpoints";

export const postQueries = {
  all:     () => ["posts"] as const,
  lists:   () => [...postQueries.all(), "list"] as const,
  list:    (filters = {}) => queryOptions({
    queryKey: [...postQueries.lists(), filters] as const,
    queryFn: ({ signal }) =>
      unwrap(apiFetch(postEndpoints.list, { query: filters, schema: PostListSchema, signal })),
  }),
  details: () => [...postQueries.all(), "detail"] as const,
  detail:  (id: number) => queryOptions({
    queryKey: [...postQueries.details(), id] as const,
    queryFn: ({ signal }) =>
      unwrap(apiFetch(postEndpoints.one, { pathParams: { id }, schema: PostSchema, signal })),
  }),
};
```

### Step 4 — use it

```tsx
import { useQuery } from "@tanstack/react-query";
import { postQueries } from "../api/queries";

export function PostList() {
  const { data, isLoading } = useQuery(postQueries.list({ limit: 10 }));
  if (isLoading) return <Skeleton />;
  return data?.posts.map((p) => <article key={p.id}>{p.title}</article>);
}
```

That's it. Query keys, validation, error handling, and invalidation all fall out of the three files above.

## Form pattern — server validation errors

```tsx
import { applyApiErrorToForm, useApiMutation } from "@shared/lib/dal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CreatePostInputSchema, PostSchema } from "../schemas/post.schema";
import { postEndpoints } from "../api/endpoints";
import { postQueries } from "../api/queries";

export function CreatePostForm() {
  const form = useForm({ resolver: zodResolver(CreatePostInputSchema) });
  const createPost = useApiMutation(postEndpoints.create, {
    schema: PostSchema,
    invalidateKeys: [postQueries.all()],
    onError: (err) => applyApiErrorToForm(form, err),
  });

  return (
    <form onSubmit={form.handleSubmit((body) => createPost.mutate({ body }))}>
      {/* ...fields... */}
    </form>
  );
}
```

When the backend returns a 400, NestJS-shaped body, field errors land on the right form fields automatically. A toast only fires if there are **no** field-level errors (those are shown inline; double-notification would be noise).

## NestJS default — and how to swap

The default error parser is `nestJsErrorParser`. It handles:

- `HttpException` bodies — `{ statusCode, message, error }` with a string `message` surface as `result.message`.
- `class-validator` 400s — `{ message: string[] }` where each entry is `"field must be…"`. These get lifted onto `result.errors: { [field]: string }`.

**For non-NestJS backends**, switch once at bootstrap:

```ts
// src/app/main.tsx (before rendering)
import { configureDal, genericErrorParser } from "@shared/lib/dal";

configureDal({ errorParser: genericErrorParser });
```

`genericErrorParser` handles the common `{ message, errors: { [field]: string | string[] } }` convention (Laravel, Rails, most Express shops).

**For a non-standard backend** (Django's `{ detail }`, FastAPI's `{ detail: [{ loc, msg, type }] }`, anything bespoke), write a 20-line parser in your app code:

```ts
import type { ErrorParser } from "@shared/lib/dal";

export const djangoErrorParser: ErrorParser = (err) => {
  const body = err.response?.data;
  return {
    message: body?.detail ?? err.message,
    status: err.response?.status,
    errors: body?.field_errors,
  };
};

configureDal({ errorParser: djangoErrorParser });
```

The rest of the DAL doesn't care.

## Global toasts

`queryClient` is wired with `QueryCache` + `MutationCache` error handlers:

- **Queries**: any `ApiError` triggers `toast.error(err.message)`.
- **Mutations**: `ApiError.message` toasts *only* when `err.errors` is empty (field errors flow to the form instead).

To suppress the toast for a specific query or mutation, set `meta: { silent: true }` on the options.

```ts
useQuery({ ...userQueries.list(), meta: { silent: true } });
```

## Delete escape hatch

`useApiMutation` covers the 80% case. For optimistic updates, multi-step mutations, or custom `onMutate` flows, drop to raw `useMutation` + `apiFetch`:

```ts
function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await apiFetch(postEndpoints.remove, { pathParams: { id } });
      if (!result.success) throw new ApiError(result);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: postQueries.lists() });
      const previous = queryClient.getQueryData(postQueries.list().queryKey);
      queryClient.setQueryData(postQueries.list().queryKey, (old) => ({
        ...old,
        posts: old.posts.filter((p) => p.id !== id),
      }));
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(postQueries.list().queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postQueries.all() });
    },
  });
}
```

The products feature's row actions use a simpler version of this pattern — see [ProductRowActions.tsx](../src/features/products/components/ProductRowActions.tsx).

## Relation to DataTable

DataTable's `DataProvider` is for table-specific list resolution (sorting, pagination, filter-driven queries). The DAL is for everything else — detail pages, forms, mutations, custom endpoints, single-item queries.

Both systems share `apiClient`, so auth/401/tenant behaviour is identical for tables and non-table calls. A DataTable in `mode: "server"` can drive off a DAL query via a custom `queryFn` that calls `apiFetch` — no new abstraction required.

## Relation to the legacy `queryKeys` factory

[`src/shared/lib/query/client.ts`](../src/shared/lib/query/client.ts) still exports a hand-written `queryKeys` object (users, contacts, products) — used by `src/features/products/api/use-products.ts`. That's the pre-DAL pattern; the Query Options Factory supersedes it. Products will migrate in a follow-up PR.

## Known gaps, noted for later

- **Codegen** — the `src/features/<x>/api/.generated/` convention is reserved for OpenAPI-generated endpoint descriptors + Zod schemas (via `@hey-api/openapi-ts`). Hand-written for now; follow-up plan tracks the migration.
- **Auth** — the `apiClient` bearer-token-from-localStorage interceptor is misaligned with `better-auth` (the Heubert backend's auth library) which uses httpOnly cookie sessions. The auth plan will drop that interceptor and add `withCredentials: true`. DAL itself is transport-agnostic and unaffected.

## Contents

- Plan: [plans/DataAccessLayerPlan.md](../plans/DataAccessLayerPlan.md)
- Reference feature: [src/features/products/](../src/features/products/)
- Core: [src/shared/lib/dal/](../src/shared/lib/dal/)
