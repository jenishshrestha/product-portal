# Auth Feature Plan — better-auth Integration

## Context

The starter currently ships with **mock auth** ([src/shared/lib/auth/credentials.ts](../src/shared/lib/auth/credentials.ts) + [src/features/auth/api/use-login.ts](../src/features/auth/api/use-login.ts)) — two hardcoded users, stored in `localStorage`, no real verification. That was placeholder scaffolding to keep the login flow visible; it was never meant to ship as production code.

Meanwhile the [Heubert backend starter](../../heubert-backend-starter) runs **better-auth** with MongoDB, email/password, 7-day sessions, and a `roles` field extension. The frontend needs to talk to it for real. This plan replaces the mock entirely with the `better-auth/react` client, wires session state into the existing user-store, and drops the stale bearer-token interceptor the DAL doc flagged.

**Scope choice:** frontend assumes the backend starter is running. No MSW, no dual-path mocks. Prototypers who cloned this repo will clone the backend too (it's a one-command `bun run dev`). Keeping the mock as a "demo mode" is tech debt the starter doesn't need.

## What the backend dictates

Inspecting [heubert-backend-starter/src/shared/auth/config.ts](../../heubert-backend-starter/src/shared/auth/config.ts) and [user.schema.ts](../../heubert-backend-starter/src/features/users/user.schema.ts):

| Backend setting | Frontend implication |
|---|---|
| `emailAndPassword.enabled: true`, `minPasswordLength: 8`, `autoSignIn: true` | Zod form schema min 8 chars; after sign-up, session exists immediately (no separate sign-in step) |
| `socialProviders.google` (optional, env-flagged) | v1 ships email/password only; Google button added later via `VITE_AUTH_GOOGLE_ENABLED` flag |
| `session.expiresIn: 7d`, `updateAge: 1d`, `cookieCache: 5min` | Client just calls `useSession()`; better-auth handles refresh |
| `advanced.defaultCookieAttributes: { sameSite: 'lax', secure: prod }` | Localhost dev works as-is; production requires same-site domains or CORS + `credentials: 'include'` |
| `user.additionalFields.roles: string[]` (default `['user']`, `input: false`) | Session user has `roles: ('user'\|'admin')[]`; frontend can't send roles during sign-up |
| `trustedOrigins: env.CORS_ORIGINS` | Backend expects frontend origin listed; documented in `.env.example` |
| Responses envelope: `{ data: ... }` | DAL config already supports via `response.dataPath` |

## Design principles

1. **Use better-auth's client directly.** No wrapper layer. The point of better-auth is its hooks (`useSession`, `signIn`, `signOut`); wrapping them erases the value.
2. **Session is the source of truth.** `authClient.useSession()` is called at the app root; other state (user-store) caches derivations, never shadows the session.
3. **Cookies over bearer tokens.** Drop the `localStorage.auth_token` interceptor. Better-auth uses httpOnly cookies; the apiClient just sets `withCredentials: true`.
4. **Protected routes gate at the route level.** TanStack Router's `beforeLoad` reads the session; no per-component auth checks scattered through features.
5. **Not over-engineered.** Sign-in, sign-up, sign-out, protected routes, session hydration. Password reset, 2FA, email verification, profile editing — follow-ups, not v1.

## Architecture

### Layer 1 — auth client ([src/shared/lib/auth/client.ts](../src/shared/lib/auth/client.ts))

```ts
import { createAuthClient } from "better-auth/react";
import { config } from "@shared/lib/config";

export const authClient = createAuthClient({
  baseURL: config.api.baseUrl, // same origin as the DAL
});

export const { useSession, signIn, signUp, signOut } = authClient;
```

One file, ~10 lines. Everything downstream imports from here.

### Layer 2 — apiClient cleanup ([src/shared/lib/api/client.ts](../src/shared/lib/api/client.ts))

Two changes:
- **Remove** the bearer-token request interceptor (lines reading `localStorage.auth_token`).
- **Add** `withCredentials: true` on the Axios instance so cookies ride along on cross-origin calls.
- **Keep** the 401 response handler — but update its action: dispatch a session-invalidate event that triggers `authClient.getSession()` to re-check (rather than deleting a token that no longer exists).

### Layer 3 — route guards

**`src/app/routes/_authenticated.tsx`** — replaces the mock-auth check with `authClient.getSession()`:

```ts
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await authClient.getSession();
    if (!data) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
});
```

**`src/app/routes/login.tsx`** — reverse: if already signed in, redirect to `/products` (or the `redirect` search param).

### Layer 4 — session hook + user-store

`useSession()` is the primary hook. The existing [user-store.ts](../src/shared/stores/user-store.ts) is slimmed to **derived state + logout convenience**:

```ts
// user-store.ts — after
export const useUserStore = create<UserState>((set) => ({
  user: null, // set by a top-level effect that mirrors authClient.useSession().data
  setUser: (user) => set({ user }),
}));

// In src/app/routes/__root.tsx, a single effect:
const { data } = authClient.useSession();
const setUser = useUserStore((s) => s.setUser);
useEffect(() => setUser(data?.user ?? null), [data, setUser]);
```

Permission helpers ([src/shared/hooks/use-permissions.ts](../src/shared/hooks/use-permissions.ts)) read from user-store as before — no API change.

### Layer 5 — forms

**Sign-in** ([src/features/auth/components/LoginForm.tsx](../src/features/auth/components/LoginForm.tsx)):

```ts
const form = useForm({ resolver: zodResolver(SignInSchema) });
const onSubmit = form.handleSubmit(async (values) => {
  const { data, error } = await authClient.signIn.email({
    email: values.email,
    password: values.password,
  });
  if (error) {
    applyApiErrorToForm(form, toApiError(error));
    return;
  }
  await router.invalidate();
  router.navigate({ to: search.redirect ?? "/products" });
});
```

**Sign-up** (new, `src/features/auth/components/SignUpForm.tsx`):

Same shape. `authClient.signUp.email({ email, password, name })`. Backend `autoSignIn: true` means the response includes the session — no separate sign-in step.

Schemas live in [auth.schema.ts](../src/features/auth/lib/auth.schema.ts):

```ts
export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const SignUpSchema = SignInSchema.extend({
  name: z.string().min(1),
});
```

Passwords enforced at 8 chars to match backend.

### Layer 6 — error mapping

better-auth errors come back as `{ code, message, status }`. A 15-line adapter converts them to the DAL's `ApiError` shape so `applyApiErrorToForm` and the existing Sonner toast wiring work unchanged:

```ts
// src/shared/lib/auth/toApiError.ts
export function toApiError(err: { code?: string; message?: string; status?: number }): ApiError {
  return new ApiError({
    success: false,
    status: err.status,
    message: err.message ?? "Authentication error",
    errors: err.code === "INVALID_PASSWORD"
      ? { password: "Incorrect password" }
      : err.code === "USER_NOT_FOUND"
        ? { email: "No account with that email" }
        : undefined,
  });
}
```

## File changes

### Remove
- [src/shared/lib/auth/credentials.ts](../src/shared/lib/auth/credentials.ts) — mock credentials
- [src/features/auth/components/DevCredentialsHint.tsx](../src/features/auth/components/DevCredentialsHint.tsx) — demo helper

### Modify
- [src/shared/lib/api/client.ts](../src/shared/lib/api/client.ts) — drop bearer-token interceptor, add `withCredentials: true`
- [src/shared/stores/user-store.ts](../src/shared/stores/user-store.ts) — slim to session-mirror cache (remove `setUser` side effects, localStorage reads)
- [src/features/auth/api/use-login.ts](../src/features/auth/api/use-login.ts) — rewrite to call `authClient.signIn.email`, or delete if the LoginForm calls authClient directly
- [src/features/auth/components/LoginForm.tsx](../src/features/auth/components/LoginForm.tsx) — use `authClient.signIn.email`
- [src/features/auth/lib/auth.schema.ts](../src/features/auth/lib/auth.schema.ts) — enforce 8-char password min, add SignUpSchema
- [src/features/auth/LoginPage.tsx](../src/features/auth/LoginPage.tsx) — remove DevCredentialsHint, add link to `/signup`
- [src/app/routes/_authenticated.tsx](../src/app/routes/_authenticated.tsx) — beforeLoad uses `authClient.getSession()`
- [src/app/routes/login.tsx](../src/app/routes/login.tsx) — redirect away if session exists
- [src/app/routes/__root.tsx](../src/app/routes/__root.tsx) — mirror `useSession()` into user-store
- [.env.example](../.env.example) — document `VITE_API_URL` as the better-auth `baseURL`
- [src/features/auth/index.ts](../src/features/auth/index.ts) — export new SignUpPage

### Add
- [src/shared/lib/auth/client.ts](../src/shared/lib/auth/client.ts) — `createAuthClient` factory + re-exported hooks
- [src/shared/lib/auth/toApiError.ts](../src/shared/lib/auth/toApiError.ts) — better-auth error → DAL ApiError adapter
- [src/features/auth/SignUpPage.tsx](../src/features/auth/SignUpPage.tsx) — page component
- [src/features/auth/components/SignUpForm.tsx](../src/features/auth/components/SignUpForm.tsx) — form
- [src/app/routes/signup.tsx](../src/app/routes/signup.tsx) — route

### Dependencies

```bash
bun add better-auth
```

Version: whichever the backend uses (pin to match). One package; client is in the same bundle (`better-auth/react`).

## Implementation phases

### Phase A — auth client + cleanup
- Add `better-auth` dependency.
- Create `src/shared/lib/auth/client.ts`.
- Modify `apiClient`: drop bearer-token interceptor, add `withCredentials: true`, update 401 handler.
- Mirror `useSession()` into user-store via a root-level effect.

### Phase B — forms + routes
- Rewrite LoginForm against `authClient.signIn.email`.
- Add SignUpForm + SignUpPage + `/signup` route.
- Update `_authenticated.tsx` beforeLoad to use `authClient.getSession()`.
- Update `/login` to redirect if already signed in.
- Wire logout in the AppSidebar footer via `authClient.signOut()` + `router.invalidate()`.

### Phase C — cleanup
- Delete `credentials.ts`, `DevCredentialsHint.tsx`.
- Remove `localStorage.auth_token` references repo-wide (grep confirms).
- Update `.env.example`.

### Phase D — docs
- New `docs/authentication.md` — quickstart (run backend, set `VITE_API_URL`, sign up/in), protected-route pattern, how to check roles.
- Update `docs/architecture.md` — one paragraph + link.

## Out of scope (follow-up plans)

- **Password reset** — better-auth supports `forgetPassword` + `resetPassword`; plug into a `/forgot-password` route when the product needs it.
- **Email verification UI** — backend doesn't currently enforce verification; frontend adds a banner + confirmation route when it does.
- **Two-factor (TOTP/WebAuthn)** — better-auth plugins exist; separate plan.
- **Google / social providers** — add a `VITE_AUTH_GOOGLE_ENABLED` flag + button on the login page once the backend has `GOOGLE_CLIENT_ID` configured.
- **Profile editing / account settings page** — separate feature.
- **Admin role management UI** — backend has `PATCH /users/:id/roles`; admin UI is a separate feature.

## Verification

1. `bun run typecheck` passes; all `localStorage.auth_token` references gone.
2. `bun run lint` passes.
3. `bun run test` — all existing tests still pass (none currently test the mock auth).
4. Start both starters locally (`bun run dev` in each):
   - **Sign up**: `/signup` creates a new user; redirects to `/products` with an active session.
   - **Sign in**: `/login` with the new credentials works; session persists across reload.
   - **Protected route**: `/products` while logged out → redirects to `/login?redirect=/products`; after sign-in, lands back on `/products`.
   - **Sign out**: AppSidebar footer button clears session; next protected route bounces to `/login`.
   - **Session expiry simulation**: clear cookies in DevTools; refresh a protected route → redirected. No stale user in the sidebar.
   - **Bad credentials**: form shows the field-level error from `toApiError` mapping.
   - **CORS**: cookies flow both directions (DevTools Network tab: `Cookie: better-auth.session_token=...` on requests, `Set-Cookie` on sign-in response).
5. Grep `bearer\|auth_token\|credentials.ts` in `src/` — zero matches except the deletion itself.
