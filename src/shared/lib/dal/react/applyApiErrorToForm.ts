import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { ApiError } from "../core/errors";

/**
 * Map an `ApiError`'s field-level validation errors onto a react-hook-form
 * instance. If the error has no `errors` object (non-validation failure),
 * no-op — the caller is expected to surface the top-level message elsewhere.
 */
export function applyApiErrorToForm<T extends FieldValues>(
  form: UseFormReturn<T>,
  err: ApiError,
): void {
  if (!err.errors) {
    return;
  }
  for (const [field, message] of Object.entries(err.errors)) {
    const msg = Array.isArray(message) ? (message[0] ?? "Invalid value") : message;
    form.setError(field as Path<T>, { type: "server", message: msg });
  }
}
