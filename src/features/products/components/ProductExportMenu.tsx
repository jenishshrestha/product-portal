import { HeaderButton } from "@shared/components/HeaderButton";
import { ApiError } from "@shared/lib/dal";
import {
  type DataTableQueryParams,
  useDataTableAdvancedFilters,
  useDataTableInstance,
} from "@shared/lib/data-table";
import { ChevronDownIcon, ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { downloadProductsExport, type ExportFormat } from "../api/export";
import { exportParamsFrom, paramsFromTableState } from "../lib/products-params";
import type { Product } from "../types/product.types";
import { ExportFormatMenu } from "./ExportFormatMenu";

/**
 * Filtered-export menu in the listing header. Reads the live DataTable
 * state at click-time so the export picks up whatever filters/sort the
 * user last applied. Selection-driven export lives in `ProductBulkActions`.
 */
export function ProductExportMenu() {
  const { table } = useDataTableInstance<Product>();
  const advanced = useDataTableAdvancedFilters();
  const [isExporting, setIsExporting] = useState(false);

  async function onPick(format: ExportFormat) {
    const state = table.getState();
    const queryParams: DataTableQueryParams = {
      page: state.pagination.pageIndex,
      pageSize: state.pagination.pageSize,
      search: state.globalFilter ?? "",
      sorting: state.sorting,
      filters: state.columnFilters,
      advancedFilters: advanced.filters,
    };
    setIsExporting(true);
    const exportPromise = downloadProductsExport({
      format,
      params: exportParamsFrom(paramsFromTableState(queryParams)),
    });
    toast.promise(exportPromise, {
      loading: "Preparing export…",
      success: `Export downloaded (${format.toUpperCase()})`,
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

  return (
    <ExportFormatMenu
      onPick={onPick}
      disabled={isExporting}
      trigger={
        <HeaderButton type="button" variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <ExternalLinkIcon className="size-3.5" />
          )}
          {isExporting ? "Exporting…" : "Export"}
          <ChevronDownIcon className="size-3.5" />
        </HeaderButton>
      }
    />
  );
}
