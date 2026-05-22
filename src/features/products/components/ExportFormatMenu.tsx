import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/DropdownMenu";
import type { ReactNode } from "react";
import type { ExportFormat } from "../api/export";

interface ExportFormatMenuProps {
  trigger: ReactNode;
  onPick: (format: ExportFormat) => void;
  disabled?: boolean;
}

/**
 * Three-format dropdown shared by the listing header (filtered export)
 * and the bulk-actions bar (selection export). Format choice is the only
 * thing this component owns — the caller decides what to do with the pick.
 */
export function ExportFormatMenu({ trigger, onPick, disabled }: ExportFormatMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onPick("xlsx")}>Excel (.xlsx)</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onPick("csv")}>CSV</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onPick("json")}>JSON (raw)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
