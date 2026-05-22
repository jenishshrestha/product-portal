import type { AxiosError } from "axios";
import type { ApiValidationError } from "../core/types";

export interface ParsedError {
  message: string;
  status?: number;
  /** Backend-defined symbolic code (e.g. `EMAIL_DOMAIN_NOT_ALLOWED`). */
  code?: string;
  errors?: ApiValidationError;
}

export type ErrorParser = (err: AxiosError) => ParsedError;
