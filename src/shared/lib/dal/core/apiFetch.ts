import { apiClient } from "@shared/lib/api/client";
import axios, { type AxiosRequestConfig } from "axios";
import { getErrorParser } from "./config";
import { interpolatePath } from "./path";
import type { ApiEndpoint, ApiFetchOptions, ApiResult } from "./types";

/**
 * Execute an API request against a typed endpoint.
 *
 * Never throws except on request cancellation (which is re-thrown so callers
 * like TanStack Query can distinguish cancellation from real failure).
 * All other outcomes — HTTP errors, network failures, schema validation
 * failures — surface via the discriminated `ApiResult` return value.
 */
export async function apiFetch<TData = unknown, TBody = unknown>(
  endpoint: ApiEndpoint,
  options: ApiFetchOptions<TBody, TData> = {},
): Promise<ApiResult<TData>> {
  const requestConfig: AxiosRequestConfig = {
    url: interpolatePath(endpoint.path, options.pathParams),
    method: endpoint.method ?? "GET",
    data: options.body,
    params: options.query,
    headers: options.headers,
    responseType: options.responseType,
    signal: options.signal,
  };

  try {
    const response = await apiClient.request<TData>(requestConfig);
    let data = response.data;

    if (options.schema) {
      const parsed = options.schema.safeParse(data);
      if (!parsed.success) {
        if (import.meta.env.DEV) {
          console.error("[DAL] Response validation failed", {
            endpoint: endpoint.key,
            path: requestConfig.url,
            issues: parsed.error.issues,
          });
        }
        return {
          success: false,
          message: "Received invalid data format from API",
          status: response.status,
        };
      }
      data = parsed.data;
    }

    return { success: true, data, status: response.status };
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const parsed = getErrorParser()(error);
      return {
        success: false,
        message: parsed.message,
        status: parsed.status,
        code: parsed.code,
        errors: parsed.errors,
      };
    }

    if (import.meta.env.DEV) {
      console.error("[DAL] Unexpected error", error);
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, message };
  }
}
