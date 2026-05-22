# Authentication

> Email/password + optional Google, backed by [better-auth](https://www.better-auth.com/). HttpOnly-cookie sessions, validated with Zod, degrades gracefully when the backend is down.

If you only read one section, read [Add an auth-gated page](#add-an-auth-gated-page).

## Why this setup

The starter ships against the Heubert backend, which runs better-auth (MongoDB adapter, 7-day sessions, `emailAndPassword.autoSignIn: true`, optional Google OAuth). The frontend does three things on top of it:

1. A thin client (`authClient`) so feature code imports from one place.
2. A `safeGetSession()` wrapper so route guards don't crash when the backend is unreachable.
3. A `toApiError()` adapter so auth failures flow through the DAL's error surface — same toasts, same `applyApiErrorToForm` wiring — instead of a second parallel error path.

Everything else (sign-in, sign-up, session state, sign-out) is plain better-auth.

## The pieces

```
src/shared/lib/auth/
├── client.ts        ← authClient + re-exports + safeGetSession
├── useAuth.ts       ← validated session hook (user, isAuthenticated)
└── toApiError.ts    ← better-auth error → DAL ApiError adapter

src/features/auth/
├── LoginPage.tsx, SignUpPage.tsx       ← 2-step (providers → credentials)
├── components/
│   ├── LoginForm.tsx, SignUpForm.tsx   ← email/password forms
│   └── ProvidersView.tsx               ← Google + "Continue with email"
└── lib/auth.schema.ts                  ← SignInSchema, SignUpSchema

src/app/routes/
├── login.tsx, signup.tsx       ← public, redirect away if session exists
└── _authenticated.tsx          ← protected, redirect to /login if not
```

## Add an auth-gated page

Put the route under `_authenticated`. That's it.

```tsx
// src/app/routes/_authenticated.settings.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return <h1>Settings</h1>;
}
```

The `_authenticated` layout route at [src/app/routes/_authenticated.tsx](../src/app/routes/_authenticated.tsx) runs `safeGetSession()` in `beforeLoad` and redirects to `/login?redirect=<current-url>` if there's no session.

Need the user inside a component? Use `useAuth()` — it wraps `useSession()` and validates the user against `UserSchema` before handing it back:

```tsx
import { useAuth } from "@shared/lib/auth/useAuth";

const { user, isAuthenticated, isPending } = useAuth();
```

`useSession()` is still available for raw session fields (tokens, expiry). There is no Zustand mirror — `authClient`'s store is the single source of truth.

## The auth client

```ts
// src/shared/lib/auth/client.ts
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: `${config.api.baseUrl}/api/auth`,
  plugins: [
    inferAdditionalFields({
      user: { roles: { type: "string[]", input: false } },
    }),
  ],
});

export const { useSession, signIn, signUp, signOut, getSession } = authClient;
```

Three things to notice:

1. **Explicit `/api/auth` in `baseURL`**. Matches [docs/backend-integration.md](./backend-integration.md#mount-points) — better-auth is mounted directly at `/api/auth`, not under `/api/v1`.
2. **`inferAdditionalFields`** teaches the client about the backend's custom `roles` field (a better-auth `additionalField`). Without it, `session.user.roles` exists at runtime but is `unknown` at the type level.
3. **`input: false`** excludes `roles` from the sign-up payload type. The backend forces `roles: ['user']` on sign-up regardless of what you send, and only admins can mutate it via `PATCH /api/v1/users/:id/roles`.

Session cookies are httpOnly. They ride along on every DAL call because [apiClient](../src/shared/lib/api/client.ts) has `withCredentials: true` set. There is no token in `localStorage` and nothing to manually attach to requests.

### OpenAPI types

Regenerate when the backend schema changes:

```bash
bunx openapi-typescript http://localhost:3000/openapi.json -o src/shared/lib/api/schema.gen.ts
```

The file carries a `@ts-nocheck` header — the backend spec has two known issues (duplicate `operationId: getSession`, missing operationIds on `/api/v1/*`) that break strict compilation of the `operations` section. Import `components["schemas"]` — those are fine.

## Sign-in pattern

```tsx
import { signIn } from "@shared/lib/auth/client";
import { toApiError } from "@shared/lib/auth/toApiError";
import { ApiError, applyApiErrorToForm } from "@shared/lib/dal";
import { useMutation } from "@tanstack/react-query";

const signInMutation = useMutation({
  mutationFn: async (values: SignInValues) => {
    try {
      const { data, error } = await signIn.email(values);
      if (error) throw toApiError(error);
      return data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError({
        success: false,
        message: "Unable to reach the server. Please check your connection and try again.",
      });
    }
  },
  onSuccess: async () => {
    await router.invalidate();
    await router.navigate({ to: redirectTo });
  },
  onError: (err: ApiError) => applyApiErrorToForm(form, err),
});
```

Three things to notice:

1. **`toApiError(error)`** converts better-auth's `{ code, message, status }` into an `ApiError` with field-level errors keyed to `email` / `password` when the code identifies a field. `INVALID_EMAIL_OR_PASSWORD` → `{ password: "Invalid email or password" }`. See [toApiError.ts](../src/shared/lib/auth/toApiError.ts) for the full mapping.
2. **The fallback `new ApiError(...)`** catches `TypeError: Failed to fetch` (backend down, DNS, CORS) and turns it into a shape that the global toast can render. Without it the user sees a generic browser error.
3. **`router.invalidate()`** re-runs `beforeLoad` on every active route so the login/signup guards see the new session and redirect away.

`signUp.email` follows the same pattern — see [SignUpForm.tsx](../src/features/auth/components/SignUpForm.tsx). Backend has `autoSignIn: true`, so a successful signup sets the session cookie in the same response; no separate sign-in call needed.

### Sign-up is dev-only

The PRD specifies admin-managed onboarding: in production, users are created by admins, not self-service. But the backend doesn't yet expose an admin user-create endpoint (`POST /api/v1/users` is on the backend's TODO), so sign-up is the only bootstrap path today.

Current gating:
- [`/signup`](../src/app/routes/signup.tsx) route `beforeLoad` redirects to `/login` when `!import.meta.env.DEV`.
- [ProvidersView](../src/features/auth/components/ProvidersView.tsx) hides the "Sign up" footer link in production.

When the backend ships admin user-create, delete the sign-up page entirely and replace with an admin-only "Create user" flow.

## Sign-out

```tsx
await signOut();
await router.invalidate();
await router.navigate({ to: "/login", search: { redirect: undefined } });
```

`signOut()` clears the cookie on the server and the in-memory session on the client. `useSession()` (and any `useAuth()` subscribers) flip to `{ data: null }` on the next tick. The router invalidate + navigate kicks the user to `/login`.

See [AppSidebar.tsx](../src/shared/components/layouts/AppSidebar.tsx) for the live implementation.

## 401 handling (DAL calls)

better-auth errors have their own shape and are handled by [toApiError](../src/shared/lib/auth/toApiError.ts) inside sign-in / sign-up mutations. But when a **DAL** call (e.g. `GET /api/v1/products`) returns 401 because the session cookie expired mid-session, the axios interceptor at [apiClient](../src/shared/lib/api/client.ts#L33) dispatches a `window` event:

```ts
window.dispatchEvent(new CustomEvent("auth:unauthorized"));
```

[AuthRedirector](../src/app/routes/__root.tsx) listens for it, invalidates the router (re-runs `beforeLoad` guards), and navigates to `/login?redirect=<current-url>`. Skipped when already on `/login` / `/signup` to avoid loops.

Auth errors (sign-in failure, sign-up validation) do **not** go through this path — they surface as form-field errors via `applyApiErrorToForm`. 403 from the DAL is not yet handled (no inline "not allowed" UI); that lands with the RBAC gating pass.

## Route guards

Three routes use `safeGetSession()` in `beforeLoad`:

- [`/login`](../src/app/routes/login.tsx) — redirect **away** (to `?redirect` target or `/products`) if already signed in.
- [`/signup`](../src/app/routes/signup.tsx) — same.
- [`/_authenticated`](../src/app/routes/_authenticated.tsx) — redirect to `/login?redirect=<current>` if not signed in.

```ts
beforeLoad: async ({ location }) => {
  const { data } = await safeGetSession();
  if (!data) {
    throw redirect({ to: "/login", search: { redirect: location.href } });
  }
},
```

Both login and signup declare the `?redirect` search param:

```ts
validateSearch: (search: Record<string, unknown>) => ({
  redirect: typeof search.redirect === "string" ? search.redirect : undefined,
}),
```

One consequence: any `<Link to="/login">` elsewhere in the app must pass `search={{ redirect: undefined }}` (or TanStack will complain that the prop is missing).

## Backend unreachable

`getSession()` rejects with `TypeError: Failed to fetch` when the backend is down. If that throw bubbles out of `beforeLoad`, TanStack Router renders the root `ErrorComponent` — the user can't even see the login page.

`safeGetSession()` catches that:

```ts
export async function safeGetSession(): Promise<SessionResult> {
  try {
    return await getSession();
  } catch (err) {
    if (isRedirect(err)) throw err;                           // preserve router redirects
    if (import.meta.env.DEV) console.warn("[auth] getSession failed; treating as unauthenticated:", err);
    return { data: null, error: null } as SessionResult;
  }
}
```

Result: `/login` and `/signup` still render when the backend is offline. Sign-in attempts fail with a toast (via the `mutationFn` fallback above) instead of an error page. Protected routes redirect to `/login` and the user at least sees the login form.

Always use `safeGetSession()` in `beforeLoad` hooks. Inside components, `useSession()` is already error-safe — it returns `{ data: null }` on network failure.

## Session validation

better-auth returns whatever the backend sends. If the backend ever drifts from the frontend's `User` shape, a malformed user object would ship through the app. [useAuth](../src/shared/lib/auth/useAuth.ts) guards against that by running `UserSchema.safeParse` on every session change:

```ts
const parsed = UserSchema.safeParse(data.user);
return parsed.success ? parsed.data : null; // warn in dev, fall back to unauthenticated
```

The canonical `User` shape lives in [src/shared/types/index.ts](../src/shared/types/index.ts) and matches the backend's better-auth user plus the `roles: ("admin" | "user")[]` additional field.

## Adding / removing providers

The Google button in [ProvidersView](../src/features/auth/components/ProvidersView.tsx) is always visible by design — it demonstrates the real OAuth pattern even when the backend hasn't configured it. When Google isn't configured server-side, the click fails with a toast (caught via `toApiError`).

To add a new social provider:

1. Enable it on the backend (`GOOGLE_CLIENT_ID`, etc., plus the better-auth server config).
2. Add a button to `ProvidersView` that calls `signIn.social({ provider: "...", callbackURL })`.

To hide Google entirely: delete the button. There is no feature flag — the file is ~80 lines of component code; swap the JSX.

## Environment

```bash
# .env
VITE_API_URL=http://localhost:3000
```

That's the only frontend variable auth cares about. The backend lives at the same origin as the DAL.

## Two error envelopes, by mount point

better-auth's handler and the business API return **different** error shapes. Frontend error handling branches on which path was called:

| Path | Shape | Handler |
|---|---|---|
| `/api/auth/*` | `{ message: string }` (better-auth) | [toApiError](../src/shared/lib/auth/toApiError.ts) in form mutations |
| `/api/v1/*` | `{ error: { code, message, details?, requestId } }` (Heubert) | DAL `heubertErrorParser` (to be added when /products lands) |

Do not try to unify these. The DAL parser doesn't know about better-auth's shape; `toApiError` doesn't know about the Heubert envelope. Keeping them separate matches the backend's actual contract.

## Gotchas

- **Never call `getSession()` in `beforeLoad` directly.** Always go through `safeGetSession()`. Plain `getSession()` will crash the route when the backend is down.
- **`<Link to="/login">` needs `search={{ redirect: undefined }}`.** The `/login` and `/signup` routes declare `validateSearch`, so TanStack Router's typed Link enforces the param at all call sites.
- **No bearer token in `localStorage`.** Sessions are httpOnly cookies. Everything works via `withCredentials: true` on `apiClient` — don't re-introduce an `Authorization` header interceptor.
- **`router.invalidate()` after sign-in / sign-out.** Without it, `beforeLoad` guards keep their stale session data and won't redirect correctly.
- **better-auth errors need `toApiError`.** Without it, auth failures won't land on form fields (email/password) and won't go through the global Sonner toast — they'd print as a raw error.
- **Password policy mirrors the backend.** `SignInSchema` / `SignUpSchema` enforce `min(8)`. If the backend policy changes, update [auth.schema.ts](../src/features/auth/lib/auth.schema.ts).

## Contents

- Client: [src/shared/lib/auth/](../src/shared/lib/auth/)
- Feature: [src/features/auth/](../src/features/auth/)
- Routes: [src/app/routes/login.tsx](../src/app/routes/login.tsx), [signup.tsx](../src/app/routes/signup.tsx), [_authenticated.tsx](../src/app/routes/_authenticated.tsx)
- Backend contract: [heubert-backend-starter](../../heubert-backend-starter/) — better-auth config lives there
