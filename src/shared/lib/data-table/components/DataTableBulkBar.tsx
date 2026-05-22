import { Button } from "@shared/components/ui/Button";
import { Separator } from "@shared/components/ui/Separator";
import { cn } from "@shared/lib/utils";
import type { Table } from "@tanstack/react-table";
import { XIcon } from "lucide-react";
import type * as React from "react";
import { useDataTableReactive } from "./DataTableContext";

interface DataTableBulkBarProps<TData> {
  table: Table<TData>;
  children: React.ReactNode;
  className?: string;
}

function DataTableBulkBar<TData>({ table, children, className }: DataTableBulkBarProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-background border-border fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit items-center gap-3 rounded-lg border px-4 py-2.5 shadow-lg",
        className,
      )}
    >
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <Separator orientation="vertical" className="h-5" />
      <div className="flex items-center gap-2">{children}</div>
      <Separator orientation="vertical" className="h-5" />
      <Button variant="ghost" size="icon-sm" onClick={() => table.toggleAllRowsSelected(false)}>
        <XIcon className="size-4" />
        <span className="sr-only">Clear selection</span>
      </Button>
    </div>
  );
}

// ---- Compound wrapper ----

function CompoundBulkBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { table } = useDataTableReactive();
  return (
    <DataTableBulkBar table={table} className={className}>
      {children}
    </DataTableBulkBar>
  );
}

export type { DataTableBulkBarProps };
export { CompoundBulkBar, DataTableBulkBar };
