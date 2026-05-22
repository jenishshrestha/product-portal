import { cn } from "@shared/lib/utils";
import { LayoutGridIcon, ListIcon } from "lucide-react";
import type { DataTableView } from "../types/data-table.types";
import { useDataTableView } from "./DataTableContext";

interface DataTableViewToggleProps {
  view: DataTableView;
  onViewChange: (view: DataTableView) => void;
  availableViews: DataTableView[];
}

/**
 * Segmented-control view toggle. `bg-muted` rail with a raised `bg-card`
 * pill on the active button (soft shadow, card-colored surface) — the same
 * pattern as the Claude Design catalog mockup. Icon-only, grid first,
 * list second.
 */
function DataTableViewToggle({ view, onViewChange, availableViews }: DataTableViewToggleProps) {
  if (availableViews.length < 2) {
    return null;
  }

  const buttonClass =
    "inline-flex h-7 w-8 items-center justify-center rounded-sm text-muted-foreground transition-[background-color,color,box-shadow] hover:text-foreground";
  const activeClass = "bg-card text-foreground shadow-sm";

  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted p-0.5">
      {availableViews.includes("card") && (
        <button
          type="button"
          aria-label="Grid view"
          aria-pressed={view === "card"}
          onClick={() => onViewChange("card")}
          className={cn(buttonClass, view === "card" && activeClass)}
        >
          <LayoutGridIcon className="size-3.5" />
        </button>
      )}
      {availableViews.includes("table") && (
        <button
          type="button"
          aria-label="List view"
          aria-pressed={view === "table"}
          onClick={() => onViewChange("table")}
          className={cn(buttonClass, view === "table" && activeClass)}
        >
          <ListIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ---- Compound wrapper ----

function CompoundViewToggle() {
  const { view, setView, availableViews } = useDataTableView();
  return <DataTableViewToggle view={view} onViewChange={setView} availableViews={availableViews} />;
}

export type { DataTableViewToggleProps };
export { CompoundViewToggle, DataTableViewToggle };
