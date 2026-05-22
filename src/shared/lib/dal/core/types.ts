import type { z } from "zod";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiEndpoint {
  /** Stable identifier used for query keys (e.g. "users.list") */
  key: string;
  /** URL path; supports {var} interpolation (e.g. "/users/{id}") */
  path: string;
  /** Defaults to GET */
  method?: HttpMethod;
}

export type QueryValue = string | number | boolean | null | undefined;

export interface ApiFetchOptions<TBody = unknown, TData = unknown> {
  body?: TBody;
  pathParams?: Record<string, string | number>;
  /**
   * Query-string parameters. Typed as `object` rather than
   * `Record<string, unknown>` because feature-defined filter types with only
   * optional properties don't satisfy the index signature under strict
   * typing; axios serializes by iterating keys at runtime regardless.
   */
  query?: object;
  headers?: Record<string, string>;
  responseType?: "json" | "blob" | "arraybuffer" | "text";
  /**
   * Optional Zod schema for response validation + type inference.
   * `z.ZodType<TData, unknown>` binds TData to the schema's OUTPUT
   * (post-transform), not the raw input shape. Without this, schemas with
   * `.transform()` silently lose their added fields at the TS layer.
   */
  schema?: z.ZodType<TData, unknown>;
  signal?: AbortSignal;
}

export interface ApiValidationError {
  [field: string]: string | string[];
}

export type ApiResult<TData> =
  | { success: true; data: TData; status: number; message?: string }
  | {
      success: false;
      data?: undefined;
      status?: number;
      /** Backend-defined symbolic code (e.g. `EMAIL_DOMAIN_NOT_ALLOWED`). */
      code?: string;
      message: string;
      errors?: ApiValidationError;
    };
