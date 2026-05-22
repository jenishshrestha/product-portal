import { cn } from "@shared/lib/utils";
import { ClockIcon, GraduationCapIcon, MonitorIcon } from "lucide-react";
import { type ComponentType, memo } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import {
  primaryDeliveryModes,
  primaryDuration,
  primaryDurationMode,
  primaryQualification,
  updatedAgo,
} from "../../lib/product-format";
import type { Product } from "../../types/product.types";

interface ProductStatusBarProps {
  product: Product;
}

const SOLID_PILL =
  "inline-flex h-[22px] items-center gap-[5px] rounded-[4px] border border-border-subtle bg-muted px-2 text-xs font-medium leading-[1.5] text-foreground";

interface SolidPillProps {
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function SolidPill({ icon: Icon, children }: SolidPillProps) {
  return (
    <span className={SOLID_PILL}>
      <Icon className="size-3" />
      {children}
    </span>
  );
}

/**
 * Horizontal pill row between the page header and the main grid — matches
 * Claude Design `.status-row` (10px gap, wraps, 24px bottom padding with a
 * dashed separator). Pills are conditional: only renders what the product
 * actually has (delivery modes may be absent, duration mode too).
 *
 * Memoized so `?tab=` switches on the parent don't churn it.
 */
export const ProductStatusBar = memo(function ProductStatusBar({ product }: ProductStatusBarProps) {
  const qualification = primaryQualification(product);
  const duration = primaryDuration(product);
  const durationMode = primaryDurationMode(product);
  const delivery = primaryDeliveryModes(product);
  const updated = updatedAgo(product);

  const durationLabel =
    duration === "—" ? undefined : durationMode ? `${duration} · ${durationMode}` : duration;

  return (
    <div
      className={cn("mb-7 flex flex-wrap items-center gap-2.5 border-b border-border-subtle pb-6")}
    >
      <StatusBadge status={product.status} />
      {qualification && qualification !== "—" && (
        <SolidPill icon={GraduationCapIcon}>{qualification}</SolidPill>
      )}
      {durationLabel && <SolidPill icon={ClockIcon}>{durationLabel}</SolidPill>}
      {delivery && <SolidPill icon={MonitorIcon}>{delivery}</SolidPill>}
      <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Updated</span>
        <span className="font-mono">{updated}</span>
      </span>
    </div>
  );
});
