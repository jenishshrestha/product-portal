import { cn } from "@shared/lib/utils";
import { InboxIcon } from "lucide-react";
import type * as React from "react";

interface DataTableEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

function DataTableEmpty({
  title = "No results found",
  description = "Try adjusting your search or filters.",
  icon,
  action,
  className,
}: DataTableEmptyProps) {
  return (
    <div
      className={cn(
        "flex min-h-96 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center",
        className,
      )}
    >
      <div className="text-muted-foreground mb-4">{icon ?? <InboxIcon className="size-12" />}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export type { DataTableEmptyProps };
export { DataTableEmpty };
