import { ApiError } from "../core/errors";
import type { ApiResult } from "../core/types";

/**
 * Bridge from the never-throws `apiFetch` contract to TanStack Query's
 * throw-on-failure contract. Use inside `queryFn` to light up `isError`.
 */
export async function unwrap<T>(promise: Promise<ApiResult<T>>): Promise<T> {
  const result = await promise;
  if (result.success) {
    return result.data;
  }
  throw new ApiError(result);
}
