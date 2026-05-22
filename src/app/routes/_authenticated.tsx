import { AppSidebar } from "@shared/components/layouts/AppSidebar";
import { ThemeToggle } from "@shared/components/ThemeToggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@shared/components/ui/Sidebar";
import { safeGetSession } from "@shared/lib/auth/client";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// Heavy theme generator — loaded on demand.
const ThemeGenerator = lazy(() =>
  import("@features/home").then((m) => ({ default: m.ThemeGenerator })),
);

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await safeGetSession();
    if (!data) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto flex items-center gap-2">
            <Suspense fallback={null}>
              <ThemeGenerator />
            </Suspense>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
