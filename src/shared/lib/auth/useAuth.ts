import { type User, UserSchema } from "@shared/types";
import { useMemo } from "react";
import { useSession } from "./client";

/**
 * Canonical session hook — wraps `authClient.useSession()` and runs
 * `UserSchema.safeParse` on the user payload so malformed data from backend
 * drift never ships through the rest of the app.
 *
 * Use this in feature code that wants `user` / `isAuthenticated` semantics.
 * For raw session fields (tokens, expiry), keep using `useSession()` directly.
 */
export function useAuth() {
  const { data, isPending } = useSession();

  const user = useMemo<User | null>(() => {
    if (!data?.user) {
      return null;
    }
    const parsed = UserSchema.safeParse(data.user);
    if (!parsed.success) {
      if (import.meta.env.DEV) {
        console.warn("[auth] Session user did not match UserSchema:", parsed.error.issues);
      }
      return null;
    }
    return parsed.data;
  }, [data]);

  return {
    user,
    isAuthenticated: user !== null,
    isPending,
  };
}
