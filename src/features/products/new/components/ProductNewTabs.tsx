import { cn } from "@shared/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ProductNewTab } from "../types";

interface ProductNewTabsProps {
  active: ProductNewTab;
  /**
   * Error counts per tab. Renders as a destructive chip next to the tab
   * label so a failed Save on a hidden tab isn't silently swallowed.
   */
  errorCounts?: Partial<Record<ProductNewTab, number>>;
}

interface TabDef {
  id: ProductNewTab;
  label: string;
}

const TABS: readonly TabDef[] = [
  { id: "overview", label: "Overview" },
  { id: "admissions", label: "Admissions & Requirements" },
  { id: "fees", label: "Fees & Funding" },
];

/**
 * Mirror of `ProductDetailTabs` for the New Course form. Each tab is a
 * `<Link>` writing `?tab=<id>` so refresh / deep-links stay on the tab the
 * user was editing. Active styling matches the detail tabs exactly so the
 * two pages feel like the same surface in different modes.
 */
export function ProductNewTabs({ active, errorCounts }: ProductNewTabsProps) {
  return (
    <div className="relative mb-6 flex gap-0.5 border-b border-border">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const errorCount = errorCounts?.[tab.id];
        return (
          <Link
            key={tab.id}
            to="/products/new"
            search={{ tab: tab.id }}
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[0.8125rem] font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {typeof errorCount === "number" && errorCount > 0 && (
              <span
                role="status"
                aria-label={`${errorCount} error${errorCount === 1 ? "" : "s"}`}
                className="inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full bg-destructive/15 px-1.5 text-[0.6875rem] font-medium text-destructive"
              >
                {errorCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
