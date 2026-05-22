import { ApiError, type ApiValidationError } from "@shared/lib/dal";

/**
 * Adapter: converts better-auth's `{ code, message, status }` error shape into
 * the DAL's `ApiError` so auth failures flow through the same error surface as
 * every other DAL call — `applyApiErrorToForm`, global Sonner toasts, etc.
 *
 * Unknown error codes fall through to a bare ApiError with just the message;
 * known codes that pin the error to a field (email / password) map onto RHF
 * field errors.
 */
interface BetterAuthError {
  code?: string | null;
  message?: string | null;
  status?: number;
  statusText?: string | null;
}

const FIELD_ERROR_CODES: Record<string, ApiValidationError> = {
  INVALID_EMAIL_OR_PASSWORD: { password: "Invalid email or password" },
  INVALID_EMAIL: { email: "Invalid email address" },
  INVALID_PASSWORD: { password: "Incorrect password" },
  USER_NOT_FOUND: { email: "No account with that email" },
  EMAIL_NOT_VERIFIED: { email: "Email not verified" },
  EMAIL_ALREADY_EXISTS: { email: "An account with that email already exists" },
  USER_ALREADY_EXISTS: { email: "An account with that email already exists" },
  PASSWORD_TOO_SHORT: { password: "Password is too short" },
  PASSWORD_TOO_LONG: { password: "Password is too long" },
};

export function toApiError(err: BetterAuthError): ApiError {
  const code = err.code ?? undefined;
  return new ApiError({
    success: false,
    status: err.status,
    message: err.message ?? err.statusText ?? "Authentication error",
    errors: code ? FIELD_ERROR_CODES[code] : undefined,
  });
}
