import { cn } from "@shared/lib/utils";
import { STATUS_LABELS } from "../lib/product-format";
import type { ProductStatus } from "../types/product.types";

interface StatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

/** Exact match to Claude Design `.badge` + `.badge-success/warning/ghost`. */
const BADGE_BASE =
  "inline-flex items-center gap-[5px] h-[22px] rounded-[4px] border px-2 text-xs font-medium leading-[1.5]";

const PILL_VARIANT: Record<ProductStatus, string> = {
  // `text-success-strong` is the themed "legible over soft-bg" variant —
  // resolves to `--success` in light mode and a brighter shade in dark.
  published: "bg-success-soft text-success-strong border-transparent",
  pending_review: "bg-warning-soft text-warning border-transparent",
  archived: "bg-transparent text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(BADGE_BASE, PILL_VARIANT[status], className)}>
      <span className="size-1.5 rounded-full bg-[currentColor]" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
