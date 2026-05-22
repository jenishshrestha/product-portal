import { cn } from "@shared/lib/utils";
import { Link, type LinkComponentProps } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";

const BASE =
  "mb-4 inline-flex h-8 items-center gap-1.5 rounded-md px-2 -ml-2 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

/**
 * Back-to-listing link. Replaces the breadcrumb on detail/edit pages —
 * a single back affordance is more honest than a 3-crumb trail that always
 * reads `Section › Subsection › X`. Pass any TanStack Router `Link` props
 * plus a `ReactNode` label.
 *
 * Promoted to shared at 2 features (products + users) — below the FDD
 * Rule of Three threshold — as a deliberate exception. Pure visual
 * primitive, no domain coupling.
 *
 * `children` is narrowed to `ReactNode` (not the render-prop form `Link`
 * also supports) — the icon position is fixed, so a render-prop wouldn't
 * compose meaningfully here.
 */
type BackLinkProps = Omit<LinkComponentProps<"a">, "children"> & {
  children: ReactNode;
};

export function BackLink({ children, className, ...props }: BackLinkProps) {
  return (
    <Link {...props} className={cn(BASE, className)}>
      <ArrowLeftIcon className="size-3.5" />
      {children}
    </Link>
  );
}
