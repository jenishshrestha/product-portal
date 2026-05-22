import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const handleError = (error: unknown): void => {
  const message = error instanceof Error ? error.message : "An error occurred";

  toast.error(message);
};

/**
 * Allowlist-validate a URL for use in `<a href>` from backend-supplied data.
 * Returns the canonicalized URL string for `http://` / `https://` / same-
 * origin relative paths; returns `undefined` for anything else — including
 * the XSS-capable `javascript:`, `data:`, and `vbscript:` schemes, or
 * malformed input. Callers should `.filter(Boolean)` / skip rendering when
 * the result is `undefined`.
 *
 * Defense-in-depth: the backend already scrubs its ingest, but user-facing
 * links should never trust that contract silently.
 */
export function safeExternalUrl(raw: string | null | undefined): string | undefined {
  if (!raw || typeof raw !== "string") {
    return undefined;
  }
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(raw, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
