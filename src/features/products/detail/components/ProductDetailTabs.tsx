import { cn } from "@shared/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ProductDetailTab } from "../types";

interface ProductDetailTabsProps {
  productId: string;
  active: ProductDetailTab;
  /**
   * Count next to the "Admissions & Requirements" tab label. Reflects the
   * number of upcoming intakes — the only count that's intuitively
   * meaningful from this surface area (fee count was dropped because 5-10
   * line items per course is noise, not signal).
   */
  intakeCount?: number;
}

interface TabDef {
  id: ProductDetailTab;
  label: string;
}

const TABS: readonly TabDef[] = [
  { id: "overview", label: "Overview" },
  { id: "admissions", label: "Admissions & Requirements" },
  { id: "fees", label: "Fees & Funding" },
];

/**
 * URL-synced tab switcher. Each tab is a `<Link>` writing `?tab=<id>` so
 * navigation is shareable, browser-back works, and no localStorage is
 * involved. Matches Claude Design `.tabs` visuals: 1px bottom border,
 * active tab painted with primary and a matching soft-colored count chip.
 */
export function ProductDetailTabs({ productId, active, intakeCount }: ProductDetailTabsProps) {
  return (
    <div className="relative mb-6 flex gap-0.5 border-b border-border">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const count = tab.id === "admissions" ? intakeCount : undefined;
        return (
          <Link
            key={tab.id}
            to="/products/$productId"
            params={{ productId }}
            search={{ tab: tab.id }}
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[0.8125rem] font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {typeof count === "number" && count > 0 && (
              <span
                className={cn(
                  "inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-medium",
                  isActive
                    ? "bg-primary-soft text-primary-strong"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
