import { LoginPage } from "@features/auth";
import { safeGetSession } from "@shared/lib/auth/client";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await safeGetSession();
    if (data) {
      throw redirect({ href: search.redirect ?? "/dashboard" });
    }
  },
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect: redirectTo } = Route.useSearch();
  return <LoginPage redirectTo={redirectTo} />;
}
