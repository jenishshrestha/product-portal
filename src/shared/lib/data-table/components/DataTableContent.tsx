import { DataTable } from "./DataTable";
import { DataTableCardGrid } from "./DataTableCardGrid";
import { useDataTableInstance, useDataTableReactive, useDataTableView } from "./DataTableContext";
import { DataTableEmpty } from "./DataTableEmpty";

interface DataTableContentProps {
  /** Override skeleton row count. Defaults to current pageSize. */
  skeletonRows?: number;
  /** Custom empty state title. */
  emptyTitle?: string;
  /** Custom empty state description. */
  emptyDescription?: string;
  className?: string;
}

function DataTableContent<TData>({
  skeletonRows,
  emptyTitle = "No results found",
  emptyDescription = "Try adjusting your filters.",
  className,
}: DataTableContentProps) {
  const { config } = useDataTableInstance<TData>();
  const { table, isLoading, isFetching, isEmpty } = useDataTableReactive<TData>();
  const { view } = useDataTableView();

  const loading = isLoading || isFetching;
  const effectiveSkeletonRows = skeletonRows ?? table.getState().pagination.pageSize;

  if (!loading && isEmpty) {
    return <DataTableEmpty title={emptyTitle} description={emptyDescription} />;
  }

  if (view === "card" && config.cardRenderer) {
    return (
      <DataTableCardGrid
        table={table}
        cardRenderer={config.cardRenderer}
        isFetching={loading}
        skeletonCount={effectiveSkeletonRows}
        className={className}
      />
    );
  }

  return (
    <DataTable
      table={table}
      isFetching={loading}
      skeletonRows={effectiveSkeletonRows}
      className={className}
      onRowClick={config.onRowClick}
    />
  );
}

export type { DataTableContentProps };
export { DataTableContent };
