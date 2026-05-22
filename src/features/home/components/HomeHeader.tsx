import { ThemeToggle } from "@shared/components/ThemeToggle";
import { Button } from "@shared/components/ui/Button";
import { useAuth } from "@shared/lib/auth/useAuth";
import { Link } from "@tanstack/react-router";
import { PackageIcon } from "lucide-react";
import { lazy, Suspense } from "react";

// Heavy theme generator (Sheet + Tabs + Accordion + Slider) — loaded on demand.
const ThemeGenerator = lazy(() =>
  import("./theme-generator/ThemeGenerator").then((m) => ({ default: m.ThemeGenerator })),
);

export function HomeHeader() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full border border-border bg-secondary">
            <PackageIcon className="size-4 text-foreground" />
          </div>
          <span className="text-sm font-medium">Product Portal</span>
        </Link>

        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <ThemeGenerator />
          </Suspense>
          <ThemeToggle />
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/login" search={{ redirect: undefined }}>
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
