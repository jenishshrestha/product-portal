import { Progress } from "@shared/components/ui/Progress";
import { Loader2Icon } from "lucide-react";
import type { ImportProgress as ImportProgressState } from "../types";

interface ImportProgressProps {
  filename: string;
  state: ImportProgressState;
}

/**
 * Live import progress. Updates after each batch completes — the user
 * sees `X of N batches`, totals for succeeded/failed, and a progress bar
 * driven by record count (not batch count) so it grows smoothly even
 * when the last batch is partial.
 */
export function ImportProgress({ filename, state }: ImportProgressProps) {
  const processed = state.succeeded.length + state.failed.length;
  const percent = state.totalRecords === 0 ? 0 : Math.round((processed / state.totalRecords) * 100);

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <Loader2Icon className="size-5 shrink-0 animate-spin text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">Importing {filename}</p>
          <p className="text-xs text-muted-foreground">
            Batch {state.batchesCompleted + 1} of {state.totalBatches}
          </p>
        </div>
        <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
          {percent}%
        </span>
      </div>

      <Progress value={percent} />

      <div className="grid grid-cols-3 gap-4 text-sm">
        <Stat label="Succeeded" value={state.succeeded.length} tone="success" />
        <Stat label="Failed" value={state.failed.length} tone="error" />
        <Stat label="Remaining" value={Math.max(0, state.totalRecords - processed)} tone="muted" />
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: number;
  tone: "success" | "error" | "muted";
}

function Stat({ label, value, tone }: StatProps) {
  const valueClass =
    tone === "success"
      ? "text-success-strong"
      : tone === "error"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`font-semibold text-2xl tabular-nums ${valueClass}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
