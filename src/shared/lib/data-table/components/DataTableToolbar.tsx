import type * as React from "react";

/**
 * Layout wrapper for the toolbar row. Consumer owns the contents (search,
 * filters, actions) via children — typically `<DT.FilterBar />` alongside
 * custom actions and a `<DT.ViewToggle />`.
 */
function CompoundToolbar({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={className ?? "flex items-center gap-2"}>{children}</div>;
}

export { CompoundToolbar };
