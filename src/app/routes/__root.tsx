import { ThemeProvider } from "@shared/components/providers";
import { Toaster } from "@shared/components/ui/Sonner";
import { setAccountDisabledHandler, setAuthRedirectHandler } from "@shared/lib/api/client";
import { signOut } from "@shared/lib/auth/client";
import { createTanStackRouterAdapter, RouterAdapterProvider } from "@shared/lib/data-table";
import { queryClient } from "@shared/lib/query/client";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet, useRouter } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Router context — `queryClient` is threaded in so route `loader`s can
 * prefetch via `ensureQueryData` without importing the client directly.
 * Keeps data-fetching testable (loader takes the client as a param).
 */
export interface RouterContext {
  queryClient: QueryClient;
}

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })),
    )
  : () => null;

// Router adapter (for syncWithUrl support)
const routerAdapter = createTanStackRouterAdapter();

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null;

const GO_HOME_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90";

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">The page you are looking for does not exist.</p>
        <Link to="/" className={GO_HOME_BUTTON_CLASS}>
          Go Home
        </Link>
      </div>
    </div>
  );
}

/**
 * Registers a handler so the axios 401 interceptor can redirect to /login.
 * The router can't be imported directly into `client.ts` (circular), so we
 * pass a small typed callback via `setAuthRedirectHandler`. Skipped on
 * /login and /signup to avoid redirect loops.
 */
function AuthRedirector() {
  const router = useRouter();
  // Idempotency lock for the 403 ACCOUNT_DISABLED handler. A ref (not a
  // closure variable) so it survives effect re-runs if `router` ever
  // becomes a non-stable dep in the future.
  const disabledFiring = useRef(false);

  useEffect(() => {
    setAuthRedirectHandler(() => {
      const here = router.state.location.pathname;
      if (here === "/login" || here === "/signup") {
        return;
      }
      void router.invalidate().then(() =>
        router.navigate({
          to: "/login",
          search: { redirect: router.state.location.href },
        }),
      );
    });
    // 403 ACCOUNT_DISABLED — admin disabled this user mid-session. Sign out
    // (clears the cookie), surface a toast, and bounce to /login. Idempotent
    // via the pathname guard + ref lock so cascading 403s don't re-fire.
    setAccountDisabledHandler(() => {
      if (disabledFiring.current) {
        return;
      }
      const here = router.state.location.pathname;
      if (here === "/login") {
        return;
      }
      disabledFiring.current = true;
      toast.error("Your account has been disabled. Contact your administrator.");
      void signOut()
        .catch(() => {
          // Cookie may already be invalid; sign-out failing is non-fatal.
        })
        .then(() => router.invalidate())
        .then(() => router.navigate({ to: "/login", search: { redirect: undefined } }))
        .finally(() => {
          disabledFiring.current = false;
        });
    });
    return () => {
      setAuthRedirectHandler(null);
      setAccountDisabledHandler(null);
    };
  }, [router]);
  return null;
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
        <p className="text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
        <Link to="/" className={GO_HOME_BUTTON_CLASS}>
          Go Home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthRedirector />
        <RouterAdapterProvider adapter={routerAdapter}>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Outlet />
          </div>
          <Toaster />
        </RouterAdapterProvider>
        <Suspense>
          <ReactQueryDevtools initialIsOpen={false} />
          <TanStackRouterDevtools position="bottom-left" />
        </Suspense>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
