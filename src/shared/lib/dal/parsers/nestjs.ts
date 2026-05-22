import type { AxiosError } from "axios";
import type { ApiValidationError } from "../core/types";
import type { ErrorParser, ParsedError } from "./types";

interface NestJsErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

const FIELD_MESSAGE_PATTERN = /^([a-zA-Z_][\w.]*)\s+(.+)$/;

function liftClassValidatorMessages(messages: string[]): ApiValidationError {
  const errors: Record<string, string[]> = {};
  for (const raw of messages) {
    const match = FIELD_MESSAGE_PATTERN.exec(raw);
    const field = match?.[1] ?? "_";
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(raw);
  }
  const out: ApiValidationError = {};
  for (const [field, list] of Object.entries(errors)) {
    out[field] = list.length === 1 ? (list[0] ?? "") : list;
  }
  return out;
}

export const nestJsErrorParser: ErrorParser = (err: AxiosError): ParsedError => {
  const body = err.response?.data as NestJsErrorBody | undefined;
  const status = err.response?.status;

  if (body && Array.isArray(body.message)) {
    return {
      message: "Validation failed",
      status,
      errors: liftClassValidatorMessages(body.message),
    };
  }

  if (body && typeof body.message === "string") {
    return { message: body.message, status };
  }

  return { message: err.message || "An unexpected error occurred", status };
};
