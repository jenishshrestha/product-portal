import { Button } from "@shared/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/DropdownMenu";
import { MoreHorizontalIcon } from "lucide-react";
import type * as React from "react";

interface RowAction<TData> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: TData) => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  hidden?: boolean;
}

interface DataTableRowActionsProps<TData> {
  row: TData;
  actions: RowAction<TData>[];
}

function DataTableRowActions<TData>({ row, actions }: DataTableRowActionsProps<TData>) {
  const visibleActions = actions.filter((a) => !a.hidden);
  if (visibleActions.length === 0) {
    return null;
  }

  const destructiveActions = visibleActions.filter((a) => a.variant === "destructive");
  const normalActions = visibleActions.filter((a) => a.variant !== "destructive");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted">
          <MoreHorizontalIcon className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {normalActions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={() => action.onClick(row)}
            disabled={action.disabled}
          >
            {action.icon && <action.icon className="size-4" />}
            {action.label}
          </DropdownMenuItem>
        ))}
        {normalActions.length > 0 && destructiveActions.length > 0 && <DropdownMenuSeparator />}
        {destructiveActions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={() => action.onClick(row)}
            disabled={action.disabled}
            className="text-destructive focus:text-destructive"
          >
            {action.icon && <action.icon className="size-4" />}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { DataTableRowActionsProps, RowAction };
export { DataTableRowActions };
