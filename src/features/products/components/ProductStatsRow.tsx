import { cn } from "@shared/lib/utils";
import { useProductCounts } from "../api/useProducts";

/**
 * Page-header stats strip. Mirrors `.list-stats` from the Claude Design
 * catalog — mono numbers in foreground, muted labels, 20px gap between
 * entries, 12px. Shows total + three status counts.
 */
export function ProductStatsRow() {
  const counts = useProductCounts();

  const items: Array<{ label: string; n: number; dotClass?: string }> = [
    { label: "total", n: counts.total },
    { label: "active", n: counts.published, dotClass: "bg-success" },
    { label: "pending review", n: counts.pendingReview, dotClass: "bg-warning" },
    { label: "disabled", n: counts.archived, dotClass: "bg-muted-foreground/60" },
  ];

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
      {items.map(({ label, n, dotClass }) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          {dotClass && <span className={cn("size-1.5 rounded-full", dotClass)} aria-hidden />}
          <span className="font-mono font-medium text-foreground">{n}</span>
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}
