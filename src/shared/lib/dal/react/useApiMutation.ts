import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { apiFetch } from "../core/apiFetch";
import { ApiError } from "../core/errors";
import type { ApiEndpoint, ApiFetchOptions } from "../core/types";

export type MutateVars<TBody, TData> = Omit<ApiFetchOptions<TBody, TData>, "schema" | "signal">;

export interface UseApiMutationOptions<TData> {
  /** Bound to the schema's OUTPUT (post-transform), not its raw input. */
  schema?: z.ZodType<TData, unknown>;
  /** Query keys to invalidate after a successful mutation */
  invalidateKeys?: readonly (readonly unknown[])[];
  onSuccess?: (data: TData) => void;
  onError?: (err: ApiError) => void;
}

/**
 * Convenience hook for the 80% mutation case: submit + auto-invalidate a list.
 * Complex cases (optimistic updates, multi-step, custom onMutate) should
 * drop down to `useMutation` + `apiFetch` directly.
 */
export function useApiMutation<TData = unknown, TBody = unknown>(
  endpoint: ApiEndpoint,
  options: UseApiMutationOptions<TData> = {},
): UseMutationResult<TData, ApiError, MutateVars<TBody, TData>> {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, MutateVars<TBody, TData>>({
    mutationFn: async (variables) => {
      const result = await apiFetch<TData, TBody>(endpoint, {
        ...variables,
        schema: options.schema,
      });
      if (!result.success) {
        throw new ApiError(result);
      }
      return result.data;
    },
    onSuccess: (data) => {
      if (options.invalidateKeys) {
        for (const key of options.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      options.onSuccess?.(data);
    },
    onError: (error) => {
      options.onError?.(error);
    },
  });
}
