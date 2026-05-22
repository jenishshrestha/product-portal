import { config } from "@shared/lib/config";
import { isRedirect } from "@tanstack/react-router";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Auth client for the Heubert backend's better-auth instance at `/api/auth/*`.
 * Session tokens flow as httpOnly cookies — axios at shared/lib/api/client.ts
 * sets `withCredentials: true` so they ride along on DAL calls too.
 *
 * `inferAdditionalFields` teaches the client about the backend's `roles`
 * custom field. Without it, `session.user.roles` exists at runtime but is
 * `unknown` at the type level. See docs/backend-integration.md.
 *
 * Re-export the hooks/helpers you actually use so feature code imports from
 * one place: `import { useSession, signIn, signOut } from "@shared/lib/auth/client"`.
 */
export const authClient = createAuthClient({
  baseURL: `${config.api.baseUrl}/api/auth`,
  plugins: [
    inferAdditionalFields({
      // `input: false` — backend forces roles=['user'] on sign-up and only
      // admins can mutate it later via PATCH /users/:id/roles. Excluding
      // from input keeps `signUp.email()` from requiring it in the payload.
      user: { roles: { type: "string[]", input: false } },
    }),
  ],
});

export const { useSession, signIn, signUp, signOut, getSession } = authClient;

/**
 * Route-guard-friendly wrapper around getSession().
 *
 * Plain getSession() rejects with `TypeError: Failed to fetch` when the backend
 * is unreachable (dev without backend, offline, CORS, etc.). If that bubbles
 * out of `beforeLoad`, TanStack Router treats it as a route-level error and
 * renders the root error boundary — the user can't even see the login page.
 *
 * Instead: catch anything that isn't a router redirect, log in dev, and return
 * `{ data: null }` so the caller treats it as "unauthenticated." The user
 * lands on /login; any attempt to sign in will fail with a toast, which is
 * better UX than a blank "Something went wrong" page.
 */
type SessionResult = Awaited<ReturnType<typeof getSession>>;

export async function safeGetSession(): Promise<SessionResult> {
  try {
    return await getSession();
  } catch (err) {
    if (isRedirect(err)) {
      throw err;
    }
    if (import.meta.env.DEV) {
      console.warn("[auth] getSession failed; treating as unauthenticated:", err);
    }
    return { data: null, error: null } as SessionResult;
  }
}
