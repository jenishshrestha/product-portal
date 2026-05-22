import { SignUpPage } from "@features/auth/SignUpPage";
import { safeGetSession } from "@shared/lib/auth/client";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    // PRD: admin-managed portal, no self-signup. Kept dev-only until the
    // backend ships POST /api/v1/users for admin-driven user creation.
    if (!import.meta.env.DEV) {
      throw redirect({ to: "/login", search: { redirect: undefined } });
    }
    const { data } = await safeGetSession();
    if (data) {
      throw redirect({ href: search.redirect ?? "/dashboard" });
    }
  },
  component: SignUpRoute,
});

function SignUpRoute() {
  const { redirect: redirectTo } = Route.useSearch();
  return <SignUpPage redirectTo={redirectTo} />;
}
