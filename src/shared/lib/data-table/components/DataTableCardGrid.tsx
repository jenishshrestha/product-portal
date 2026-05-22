import { Skeleton } from "@shared/components/ui/Skeleton";
import { cn } from "@shared/lib/utils";
import type { Table } from "@tanstack/react-table";
import { Fragment, type ReactNode } from "react";

interface DataTableCardGridProps<TData> {
  table: Table<TData>;
  cardRenderer: (
    row: TData,
    options: { isSelected: boolean; onSelect: (selected: boolean) => void },
  ) => ReactNode;
  isFetching?: boolean;
  skeletonCount?: number;
  className?: string;
}

function DataTableCardGrid<TData>({
  table,
  cardRenderer,
  isFetching,
  skeletonCount = 6,
  className,
}: DataTableCardGridProps<TData>) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {isFetching
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <Skeleton key={`card-skeleton-${String(index)}`} className="h-48 w-full" />
          ))
        : table.getRowModel().rows.map((row) => (
            // Keyed Fragment so consumers' cardRenderer output doesn't need
            // to hoist a key onto its root element.
            <Fragment key={row.id}>
              {cardRenderer(row.original, {
                isSelected: row.getIsSelected(),
                onSelect: (selected) => row.toggleSelected(selected),
              })}
            </Fragment>
          ))}
    </div>
  );
}

export type { DataTableCardGridProps };
export { DataTableCardGrid };
