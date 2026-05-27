import { cn } from "@shared/lib/utils";
import type { ComponentType, ReactNode } from "react";

interface DetailCardProps {
  title: string;
  /** Optional leading icon from `lucide-react` — sized 16px to match design. */
  icon?: ComponentType<{ className?: string }>;
  /** Optional subtitle rendered in the header's left slot, after the title. */
  subtitle?: ReactNode;
  /** Optional action slot (buttons, toggles) rendered far-right in header. */
  action?: ReactNode;
  /** Drop header-body border + body padding. Used by tables that own their own grid. */
  flush?: boolean;
  /** Dense body padding (`16px 20px` instead of `20px`). */
  dense?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Exact match to Claude Design `.card` + `.card-header` + `.card-body`:
 * 1px border, 8px radius, 14/20 header padding, 20px body padding with
 * `dense` and `flush` variants. Sibling cards get a 16px gap via the
 * parent `space-y-4` — no per-card `margin-top`.
 */
export function DetailCard({
  title,
  icon: Icon,
  subtitle,
  action,
  flush = false,
  dense = false,
  children,
  className,
}: DetailCardProps) {
  return (
    <section className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          <h3 className="text-sm font-medium tracking-[-0.005em] text-foreground">{title}</h3>
          {subtitle &&
            (typeof subtitle === "string" ? (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            ) : (
              <>{subtitle}</>
            ))}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </header>
      <div className={cn(!flush && (dense ? "px-5 py-4" : "p-5"))}>{children}</div>
    </section>
  );
}
