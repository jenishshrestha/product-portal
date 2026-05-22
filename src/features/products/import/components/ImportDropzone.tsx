import { Alert, AlertDescription } from "@shared/components/ui/Alert";
import { cn } from "@shared/lib/utils";
import { FileJsonIcon, UploadCloudIcon } from "lucide-react";
import { useId, useRef, useState } from "react";

interface ImportDropzoneProps {
  onFile: (file: File) => void;
  /** Persistent inline error from the parent (parse failure). */
  errorMessage?: string;
}

/**
 * Drag-and-drop file picker. Supports both drop and click-to-browse.
 * Parse errors are owned by the parent and surfaced inline below the
 * zone — never as a toast (errors should persist until resolved).
 */
export function ImportDropzone({ onFile, errorMessage }: ImportDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) {
      onFile(file);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 px-8 py-16 text-center transition-colors hover:border-primary/50 hover:bg-muted/50",
          isDragging && "border-primary bg-primary/5",
        )}
      >
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors",
            isDragging && "bg-primary/15 text-primary",
          )}
        >
          {isDragging ? (
            <UploadCloudIcon className="size-6" />
          ) : (
            <FileJsonIcon className="size-6" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isDragging ? "Drop to upload" : "Drop your JSON file here, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground">
            Files larger than 500 records will auto-chunk into multiple batches.
          </p>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
