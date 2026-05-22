import { BackLink } from "@shared/components/BackLink";
import { PageHeader } from "@shared/components/PageHeader";
import { ApiError } from "@shared/lib/dal";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { bulkImportProducts } from "../api/import";
import { ImportDropzone } from "./components/ImportDropzone";
import { ImportPreview } from "./components/ImportPreview";
import { ImportProgress as ImportProgressView } from "./components/ImportProgress";
import { ImportResults } from "./components/ImportResults";
import { ImportParseError, parseImportFile } from "./lib/parse";
import type { ImportProgress, WizardState } from "./types";

const INITIAL: WizardState = { kind: "idle" };

/**
 * Bulk-import wizard. State machine: idle → parsed → importing → done.
 * Single-page (no sub-routes) because the steps share state and back-button
 * behavior should reset to idle, not bounce through history.
 */
export function ProductImportPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<WizardState>(INITIAL);
  const [parseError, setParseError] = useState<string | undefined>();

  async function onFile(file: File) {
    setParseError(undefined);
    let text: string;
    try {
      text = await file.text();
    } catch (err) {
      setParseError(
        err instanceof Error ? `Couldn't read the file: ${err.message}` : "Couldn't read the file.",
      );
      return;
    }
    try {
      const { records, preview } = parseImportFile(text);
      setState({
        kind: "parsed",
        file: { name: file.name, size: file.size },
        records,
        preview,
      });
    } catch (err) {
      const message = err instanceof ImportParseError ? err.message : "Couldn't parse the file.";
      setParseError(message);
    }
  }

  async function onImport() {
    if (state.kind !== "parsed") {
      return;
    }

    const initialProgress: ImportProgress = {
      totalRecords: state.records.length,
      totalBatches: Math.max(1, Math.ceil(state.records.length / 500)),
      batchesCompleted: 0,
      succeeded: [],
      failed: [],
    };

    setState({
      kind: "importing",
      file: state.file,
      records: state.records,
      progress: initialProgress,
    });

    try {
      const final = await bulkImportProducts(state.records, (progress) => {
        setState({
          kind: "importing",
          file: state.file,
          records: state.records,
          progress,
        });
      });
      setState({
        kind: "done",
        file: state.file,
        records: state.records,
        progress: final,
      });
    } catch (err) {
      // Transport-level failure (the entire import aborted). Per-record
      // failures don't reach this branch — they accumulate in `progress.failed`.
      const message =
        err instanceof ApiError
          ? err.message
          : "Import aborted. Check your connection and try again.";
      toast.error(message);
      setState({
        kind: "parsed",
        file: state.file,
        records: state.records,
        preview: state.preview,
      });
    }
  }

  function reset() {
    setState(INITIAL);
    setParseError(undefined);
  }

  return (
    <div className="space-y-6">
      <BackLink to="/products">Back to products</BackLink>

      <PageHeader.Root>
        <PageHeader.Content>
          <PageHeader.Title>Bulk Import</PageHeader.Title>
          <PageHeader.Description>
            Upload a JSON file of v19-shaped product records. New combinations are inserted;
            existing institution + course pairs are updated.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader.Root>

      {state.kind === "idle" && <ImportDropzone onFile={onFile} errorMessage={parseError} />}

      {state.kind === "parsed" && (
        <ImportPreview
          filename={state.file.name}
          fileSize={state.file.size}
          recordCount={state.records.length}
          preview={state.preview}
          isImporting={false}
          onCancel={reset}
          onImport={onImport}
        />
      )}

      {state.kind === "importing" && (
        <ImportProgressView filename={state.file.name} state={state.progress} />
      )}

      {state.kind === "done" && (
        <ImportResults
          filename={state.file.name}
          state={state.progress}
          onImportAnother={reset}
          onDone={() => navigate({ to: "/products" })}
        />
      )}
    </div>
  );
}
