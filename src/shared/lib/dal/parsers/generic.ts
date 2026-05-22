import type { AxiosError } from "axios";
import type { ApiValidationError } from "../core/types";
import type { ErrorParser, ParsedError } from "./types";

interface GenericErrorBody {
  message?: string;
  errors?: ApiValidationError;
}

export const genericErrorParser: ErrorParser = (err: AxiosError): ParsedError => {
  const body = err.response?.data as GenericErrorBody | undefined;
  const status = err.response?.status;

  return {
    message: body?.message ?? err.message ?? "An unexpected error occurred",
    status,
    errors: body?.errors,
  };
};
