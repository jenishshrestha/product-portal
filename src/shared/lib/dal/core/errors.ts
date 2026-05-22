import type { ApiResult, ApiValidationError } from "./types";

type FailedResult = Extract<ApiResult<unknown>, { success: false }>;

export class ApiError extends Error {
  readonly status?: number;
  /** Backend-defined symbolic code (e.g. `EMAIL_DOMAIN_NOT_ALLOWED`). */
  readonly code?: string;
  readonly errors?: ApiValidationError;

  constructor(result: FailedResult) {
    super(result.message);
    this.name = "ApiError";
    this.status = result.status;
    this.code = result.code;
    this.errors = result.errors;
  }
}
