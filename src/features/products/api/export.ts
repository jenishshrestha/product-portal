/**
 * Product export service. Calls `GET /api/v1/products/export` (cookie-auth)
 * and triggers a browser download via blob + `<a download>`.
 *
 * Why not `window.location.assign`: the spec calls that the simplest wiring,
 * but a 401 would dump the JSON error body into the address bar. Going
 * through `fetch` lets us route 401/422 through the same `ApiError` channel
 * the rest of the DAL uses (toast, redirect-to-login, etc.).
 *
 * Endpoint contract: docs/backend-integration.md (Export section).
 */

import { config } from "@shared/lib/config";
import { ApiError } from "@shared/lib/dal";
import type { ProductsParams } from "../types/product.types";

export type ExportFormat = "xlsx" | "csv" | "json";

interface DownloadOptions {
  format: ExportFormat;
  /** Active filters from the listing — page/limit are NOT accepted by /export. */
  params?: Omit<ProductsParams, "page" | "limit">;
  /** Selection-driven export. Up to 200 ids — backend 422s past that. */
  ids?: string[];
}

const FALLBACK_EXT: Record<ExportFormat, string> = {
  xlsx: "xlsx",
  csv: "csv",
  json: "json",
};

export async function downloadProductsExport(options: DownloadOptions): Promise<void> {
  const url = new URL(`${config.api.baseUrl}/api/v1/products/export`);
  url.searchParams.set("format", options.format);

  if (options.ids?.length) {
    url.searchParams.set("ids", options.ids.join(","));
  } else if (options.params) {
    appendParams(url.searchParams, options.params);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    throw new ApiError({
      success: false,
      message: body.error?.message ?? "Export failed",
      status: response.status,
      code: body.error?.code,
    });
  }

  const blob = await response.blob();
  const filename =
    parseFilename(response.headers.get("Content-Disposition")) ??
    `products-${new Date().toISOString().slice(0, 10)}.${FALLBACK_EXT[options.format]}`;
  triggerDownload(blob, filename);
}

function appendParams(
  search: URLSearchParams,
  params: Omit<ProductsParams, "page" | "limit">,
): void {
  for (const [key, value] of Object.entries(params)) {
    if (value == null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) {
          search.append(key, String(item));
        }
      }
    } else {
      search.set(key, String(value));
    }
  }
}

const FILENAME_RE = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i;

function parseFilename(disposition: string | null): string | undefined {
  if (!disposition) {
    return undefined;
  }
  const match = disposition.match(FILENAME_RE);
  if (!match?.[1]) {
    return undefined;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
