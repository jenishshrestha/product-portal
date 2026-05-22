import { Button } from "@shared/components/ui/Button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/components/ui/Collapsible";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  DownloadIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useMemo } from "react";
import type { ImportProgress } from "../types";
import { FailedRowCard } from "./FailedRowCard";

interface ImportResultsProps {
  filename: string;
  state: ImportProgress;
  onImportAnother: () => void;
  onDone: () => void;
}

export function ImportResults({ filename, state, onImportAnother, onDone }: ImportResultsProps) {
  const inserted = useMemo(
    () => state.succeeded.filter((r) => r.action === "inserted").length,
    [state.succeeded],
  );
  const updated = useMemo(
    () => state.succeeded.filter((r) => r.action === "updated").length,
    [state.succeeded],
  );
  const failedCount = state.failed.length;
  const allFailed = failedCount > 0 && state.succeeded.length === 0;
  const partial = failedCount > 0 && state.succeeded.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          {failedCount === 0 ? (
            <div className="flex size-10 items-center justify-center rounded-full bg-success-soft text-success-strong">
              <CheckCircle2Icon className="size-5" />
            </div>
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-warning-soft text-warning">
              <AlertTriangleIcon className="size-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">
              {failedCount === 0
                ? "Import complete"
                : allFailed
                  ? "Import failed"
                  : "Import partially complete"}
            </h2>
            <p className="truncate text-xs text-muted-foreground">{filename}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Stat label="Inserted" value={inserted} tone="success" />
          <Stat label="Updated" value={updated} tone="info" />
          <Stat label="Failed" value={failedCount} tone={failedCount > 0 ? "error" : "muted"} />
        </div>

        {partial && (
          <p className="text-xs text-muted-foreground">
            {state.succeeded.length.toLocaleString()} of {state.totalRecords.toLocaleString()}{" "}
            records imported successfully. Review the failed rows below to fix and re-upload.
          </p>
        )}
      </div>

      {/* Failed (open by default) */}
      {failedCount > 0 && (
        <Collapsible defaultOpen className="space-y-3 group/failed">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-2 text-left hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Failed rows</h3>
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                {failedCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadFailedRecords(filename, state);
                }}
              >
                <DownloadIcon className="size-3.5" />
                Download as JSON
              </Button>
              <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]/failed:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            {state.failed.map((row) => (
              <FailedRowCard key={row.index} row={row} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Succeeded (collapsed by default) */}
      {state.succeeded.length > 0 && (
        <Collapsible className="space-y-3 group/succeeded">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-2 text-left hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Succeeded rows</h3>
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success-strong">
                {state.succeeded.length}
              </span>
            </div>
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]/succeeded:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
              {state.succeeded.map((row) => (
                <div
                  key={row.index}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-1.5"
                >
                  <span className="truncate font-mono">Row {row.index + 1}</span>
                  <span
                    className={
                      row.action === "inserted" ? "text-success-strong" : "text-muted-foreground"
                    }
                  >
                    {row.action === "inserted" ? "Inserted" : "Updated"}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Footer actions */}
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onImportAnother}>
          <RefreshCwIcon className="size-4" />
          Import another file
        </Button>
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: number;
  tone: "success" | "error" | "info" | "muted";
}

function Stat({ label, value, tone }: StatProps) {
  const valueClass =
    tone === "success"
      ? "text-success-strong"
      : tone === "error"
        ? "text-destructive"
        : tone === "info"
          ? "text-foreground"
          : "text-muted-foreground";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`font-semibold text-2xl tabular-nums ${valueClass}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function downloadFailedRecords(sourceFilename: string, state: ImportProgress): void {
  const payload = state.failed.map((row) => ({
    row: row.index + 1,
    record: row.record,
    error: row.error,
  }));
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const baseName = sourceFilename.replace(/\.json$/i, "");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}.failed.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
