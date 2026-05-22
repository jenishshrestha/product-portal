import { safeGetSession } from "@shared/lib/auth/client";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

/**
 * Admin-only layout. The `_authenticated` parent already redirects
 * unauthenticated users to /login; this layer adds the role check once for
 * every `/admin/*` page (Users, future admin tools) so individual route
 * files don't repeat the guard. Backend enforces the same gate via 403, so
 * this is just for UX cleanliness — no security boundary lives here.
 */
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await safeGetSession();
    const roles = (data?.user as { roles?: string[] } | undefined)?.roles ?? [];
    if (!roles.includes("admin")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
