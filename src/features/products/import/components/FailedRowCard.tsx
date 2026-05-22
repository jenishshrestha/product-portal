import { Badge } from "@shared/components/ui/Badge";
import { Button } from "@shared/components/ui/Button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import type { FailedRow } from "../types";

interface FailedRowCardProps {
  row: FailedRow;
}

/**
 * One failed-row card. Shows the file-global row number, the key
 * identifying fields (institution + course), the error code+message,
 * and a Copy button that copies a structured JSON payload of the original
 * record + error — so the user can paste, fix, and re-upload.
 */
export function FailedRowCard({ row }: FailedRowCardProps) {
  const rec = (row.record ?? {}) as Record<string, unknown>;
  const inst = (rec.institution_details ?? {}) as Record<string, unknown>;
  const course = (rec.course_details ?? {}) as Record<string, unknown>;
  const institutionName = typeof inst.institution_name === "string" ? inst.institution_name : "—";
  const courseName = typeof course.course_name === "string" ? course.course_name : "—";

  const [copied, setCopied] = useState(false);

  async function copyDetails() {
    const payload = {
      row: row.index + 1,
      record: row.record,
      error: row.error,
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive" className="font-mono text-xs">
              Row {row.index + 1}
            </Badge>
            {row.error.code && (
              <Badge variant="outline" className="font-mono text-xs">
                {row.error.code}
              </Badge>
            )}
          </div>
          <p className="truncate text-sm font-medium">{institutionName}</p>
          <p className="truncate text-xs text-muted-foreground">{courseName}</p>
          <p className="text-xs text-destructive">{row.error.message}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyDetails}
          aria-label="Copy row details"
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
