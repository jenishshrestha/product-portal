import { Alert, AlertDescription, AlertTitle } from "@shared/components/ui/Alert";
import { Badge } from "@shared/components/ui/Badge";
import { Button } from "@shared/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/Table";
import { FileJsonIcon, InfoIcon, Loader2Icon, UploadCloudIcon, XIcon } from "lucide-react";
import { IMPORT_BATCH_SIZE } from "../../api/import";
import type { PreviewRow } from "../types";

interface ImportPreviewProps {
  filename: string;
  fileSize: number;
  recordCount: number;
  preview: PreviewRow[];
  isImporting: boolean;
  onCancel: () => void;
  onImport: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportPreview({
  filename,
  fileSize,
  recordCount,
  preview,
  isImporting,
  onCancel,
  onImport,
}: ImportPreviewProps) {
  const totalBatches = Math.ceil(recordCount / IMPORT_BATCH_SIZE);

  return (
    <div className="space-y-5">
      {/* File card */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <FileJsonIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{filename}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(fileSize)} · {recordCount.toLocaleString()} record
            {recordCount === 1 ? "" : "s"}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {recordCount.toLocaleString()}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onCancel}
          disabled={isImporting}
          aria-label="Choose another file"
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      {/* Behavior heads-up */}
      <Alert>
        <InfoIcon className="size-4" />
        <AlertTitle>Upsert by institution + course name</AlertTitle>
        <AlertDescription>
          Existing products with the same institution and course name will be updated. New
          combinations will be inserted.
          {totalBatches > 1 && (
            <>
              {" "}
              This file will import in <strong>{totalBatches} batches</strong> of up to{" "}
              {IMPORT_BATCH_SIZE.toLocaleString()} records.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Preview table */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Preview · first {preview.length} of {recordCount.toLocaleString()}
        </p>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Study level</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Tuition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((row) => (
                <TableRow key={row.index}>
                  <TableCell className="text-muted-foreground">{row.index + 1}</TableCell>
                  <TableCell className="font-medium">{row.institution}</TableCell>
                  <TableCell>{row.course}</TableCell>
                  <TableCell className="text-muted-foreground">{row.qualification}</TableCell>
                  <TableCell className="text-muted-foreground">{row.studyLevel}</TableCell>
                  <TableCell className="text-muted-foreground">{row.duration}</TableCell>
                  <TableCell className="text-muted-foreground">{row.country}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.tuition}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isImporting}>
          Choose another file
        </Button>
        <Button type="button" onClick={onImport} disabled={isImporting}>
          {isImporting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Importing…
            </>
          ) : (
            <>
              <UploadCloudIcon className="size-4" />
              Import {recordCount.toLocaleString()} product{recordCount === 1 ? "" : "s"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
