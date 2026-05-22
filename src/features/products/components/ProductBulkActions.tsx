import { Button } from "@shared/components/ui/Button";
import { usePermissions } from "@shared/hooks";
import { ApiError } from "@shared/lib/dal";
import { DT, useDataTableInstance, useDataTableReactive } from "@shared/lib/data-table";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ChevronDownIcon,
  DownloadIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { downloadProductsExport, type ExportFormat } from "../api/export";
import {
  type BulkMutationResult,
  useBulkArchiveProducts,
  useBulkDeleteProducts,
  useBulkUnarchiveProducts,
} from "../api/useProducts";
import type { Product } from "../types/product.types";
import { BulkEditDialog } from "./BulkEditDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { ExportFormatMenu } from "./ExportFormatMenu";

/** Backend rejects > 200 ids with 422; client-side guard for a friendlier message. */
const SELECTION_EXPORT_LIMIT = 200;

/**
 * Toast helper for bulk ops. "All succeeded" → success. "Some failed" →
 * warning with counts. "All failed" → error.
 */
function toastBulkResult(result: BulkMutationResult, verb: string): void {
  const { succeeded, failed } = result;
  if (failed.length === 0) {
    toast.success(`${verb} ${succeeded.length} course${succeeded.length === 1 ? "" : "s"}.`);
    return;
  }
  if (succeeded.length === 0) {
    toast.error(
      `Failed to ${verb.toLowerCase()} ${failed.length} course${failed.length === 1 ? "" : "s"}.`,
    );
    return;
  }
  toast.warning(
    `${verb} ${succeeded.length} of ${succeeded.length + failed.length} courses — ${failed.length} failed.`,
  );
}

/**
 * Bulk-action bar for the products listing. Mounts inside `<DT.Root>` so
 * it can reach the selection state. `DT.BulkBar` auto-hides at 0 selection,
 * so no visibility gating needed here.
 *
 * Export is always available; Archive + Delete are admin-only — non-admins
 * hit 403 on the server anyway, but gating UI-side avoids misleading CTAs.
 */
export function ProductBulkActions() {
  const { canDelete, isSuperadmin } = usePermissions();
  const { table } = useDataTableInstance<Product>();
  // Reactive to selection changes so the button labels (e.g. "Delete 3")
  // update as the user picks / unpicks rows.
  const { table: reactiveTable } = useDataTableReactive<Product>();

  const bulkDelete = useBulkDeleteProducts();
  const bulkArchive = useBulkArchiveProducts();
  const bulkUnarchive = useBulkUnarchiveProducts();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  const selectedRows = reactiveTable.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((r) => r.original.id);
  const selectedCount = selectedIds.length;

  // Context-aware gating: show Archive if any row isn't already archived,
  // show Publish if any row isn't already published. Both render when a
  // mixed selection contains `pending_review` rows (they're neither) — an
  // admin might want to move them either way.
  const showArchive = selectedRows.some((r) => r.original.status !== "archived");
  const showUnarchive = selectedRows.some((r) => r.original.status !== "published");

  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format: ExportFormat) {
    if (selectedCount === 0) {
      return;
    }
    if (selectedCount > SELECTION_EXPORT_LIMIT) {
      toast.error(`Select up to ${SELECTION_EXPORT_LIMIT} rows. Use filters for larger exports.`);
      return;
    }
    setIsExporting(true);
    const exportPromise = downloadProductsExport({ format, ids: selectedIds });
    toast.promise(exportPromise, {
      loading: "Preparing export…",
      success: `Exported ${selectedCount} course${selectedCount === 1 ? "" : "s"} (${format.toUpperCase()})`,
      error: (err) => (err instanceof ApiError ? err.message : "Export failed. Please try again."),
    });
    try {
      await exportPromise;
    } catch {
      // toast.promise already surfaced the error.
    } finally {
      setIsExporting(false);
    }
  }

  async function handleArchive() {
    if (selectedCount === 0) {
      return;
    }
    const result = await bulkArchive.mutateAsync(selectedIds);
    toastBulkResult(result, "Disabled");
    if (result.succeeded.length > 0) {
      table.toggleAllRowsSelected(false);
    }
  }

  async function handleUnarchive() {
    if (selectedCount === 0) {
      return;
    }
    const result = await bulkUnarchive.mutateAsync(selectedIds);
    toastBulkResult(result, "Enabled");
    if (result.succeeded.length > 0) {
      table.toggleAllRowsSelected(false);
    }
  }

  async function handleDelete() {
    if (selectedCount === 0) {
      return;
    }
    const result = await bulkDelete.mutateAsync(selectedIds);
    toastBulkResult(result, "Deleted");
    setConfirmDeleteOpen(false);
    if (result.succeeded.length > 0) {
      table.toggleAllRowsSelected(false);
    }
  }

  return (
    <>
      <DT.BulkBar>
        <ExportFormatMenu
          onPick={handleExport}
          disabled={isExporting}
          trigger={
            <Button variant="outline" size="sm" disabled={isExporting}>
              {isExporting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <DownloadIcon className="size-4" />
              )}
              {isExporting ? "Exporting…" : "Export"}
              <ChevronDownIcon className="size-3.5" />
            </Button>
          }
        />
        {isSuperadmin && (
          <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(true)}>
            <PencilIcon className="size-4" />
            Bulk Edit
          </Button>
        )}
        {isSuperadmin && showArchive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={bulkArchive.isPending}
          >
            <ArchiveIcon className="size-4" />
            {bulkArchive.isPending ? "Disabling..." : "Disable"}
          </Button>
        )}
        {isSuperadmin && showUnarchive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnarchive}
            disabled={bulkUnarchive.isPending}
          >
            <ArchiveRestoreIcon className="size-4" />
            {bulkUnarchive.isPending ? "Enabling..." : "Enable"}
          </Button>
        )}
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={bulkDelete.isPending}
          >
            <Trash2Icon className="size-4" />
            Delete
          </Button>
        )}
      </DT.BulkBar>

      <BulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedIds={selectedIds}
        onApplied={() => table.toggleAllRowsSelected(false)}
      />

      <DeleteConfirmationDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleDelete}
        title={`Delete ${selectedCount} course${selectedCount === 1 ? "" : "s"}?`}
        description={`This will soft-delete ${selectedCount} course${selectedCount === 1 ? "" : "s"}. They'll be hidden from the listing and detail pages. Deletions are reversible by an admin; type DELETE to confirm.`}
        isPending={bulkDelete.isPending}
      />
    </>
  );
}
