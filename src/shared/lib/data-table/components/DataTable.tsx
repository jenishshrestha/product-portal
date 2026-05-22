import { Checkbox } from "@shared/components/ui/Checkbox";
import { Skeleton } from "@shared/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/Table";
import { cn } from "@shared/lib/utils";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";

const INTERACTIVE_SELECTOR =
  'a, button, input, label, [role="checkbox"], [role="button"], [role="menuitem"], [data-radix-popper-content-wrapper]';

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  isFetching?: boolean;
  skeletonRows?: number;
  className?: string;
  /** Row-body click handler. Guarded against clicks on child interactive elements. */
  onRowClick?: (row: TData) => void;
}

function DataTable<TData>({
  table,
  isFetching,
  skeletonRows = 10,
  className,
  onRowClick,
}: DataTableProps<TData>) {
  const visibleColumns = table.getVisibleLeafColumns();

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isFetching ? (
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${String(rowIndex)}`}>
                {visibleColumns.map((column) => (
                  <TableCell key={column.id}>
                    {column.id === "select" ? (
                      <Checkbox disabled aria-label="Loading" />
                    ) : (
                      <Skeleton className="h-5 w-full max-w-52" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={
                  onRowClick
                    ? (event) => {
                        if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) {
                          return;
                        }
                        onRowClick(row.original);
                      }
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export type { DataTableProps };
export { DataTable };
