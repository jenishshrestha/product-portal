import type { AxiosError } from "axios";
import type { ApiValidationError } from "../core/types";
import type { ErrorParser, ParsedError } from "./types";

/**
 * Heubert backend error envelope — differs from the NestJS default parser:
 *   { "error": { "code": "...", "message": "...", "details"?: unknown, "requestId": "..." } }
 *
 * For 422 (VALIDATION_ERROR), `details` is an array of Zod issues
 * (`{ path: [...], message }`). Lift those onto `ApiValidationError` so
 * `applyApiErrorToForm` can surface them as RHF field errors.
 *
 * `requestId` is the correlation key for backend logs / Sentry. Log it in
 * dev. Phase 3 (polish) will widen `ParsedError` to carry it into toasts.
 */
interface HeubertErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
    requestId?: string;
  };
}

interface ZodIssueLike {
  path?: (string | number)[];
  message?: string;
}

function liftZodIssues(issues: ZodIssueLike[]): ApiValidationError | undefined {
  const buckets: Record<string, string[]> = {};
  for (const issue of issues) {
    if (!issue?.message) {
      continue;
    }
    const key = issue.path?.length ? issue.path.join(".") : "_";
    const list = buckets[key] ?? [];
    list.push(issue.message);
    buckets[key] = list;
  }
  if (Object.keys(buckets).length === 0) {
    return undefined;
  }
  const out: ApiValidationError = {};
  for (const [field, list] of Object.entries(buckets)) {
    out[field] = list.length === 1 ? (list[0] ?? "") : list;
  }
  return out;
}

export const heubertErrorParser: ErrorParser = (err: AxiosError): ParsedError => {
  const status = err.response?.status;
  const body = err.response?.data as HeubertErrorBody | undefined;
  const envelope = body?.error;

  if (!envelope) {
    return { message: err.message || "An unexpected error occurred", status };
  }

  if (import.meta.env.DEV && envelope.requestId) {
    console.warn(
      `[DAL] ${status ?? "??"} ${envelope.code ?? "?"} — requestId=${envelope.requestId}`,
    );
  }

  const errors =
    status === 422 && Array.isArray(envelope.details)
      ? liftZodIssues(envelope.details as ZodIssueLike[])
      : undefined;

  return {
    message: envelope.message ?? "An unexpected error occurred",
    status,
    code: envelope.code,
    errors,
  };
};
