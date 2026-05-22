import { apiClient } from "@shared/lib/api/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../core/errors";
import { useApiMutation } from "./useApiMutation";

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useApiMutation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves with response data on success and invalidates the configured keys", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");

    vi.spyOn(apiClient, "request").mockResolvedValueOnce({
      data: { id: 1, name: "Ada" },
      status: 201,
    } as never);

    const { result } = renderHook(
      () =>
        useApiMutation<{ id: number; name: string }, { name: string }>(
          { key: "users.create", path: "/users", method: "POST" },
          { invalidateKeys: [["users"]] },
        ),
      { wrapper: makeWrapper(client) },
    );

    let resolved: { id: number; name: string } | undefined;
    await act(async () => {
      resolved = await result.current.mutateAsync({ body: { name: "Ada" } });
    });

    expect(resolved).toEqual({ id: 1, name: "Ada" });
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["users"] }));
  });

  it("surfaces failures as ApiError with status and field errors", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

    const axiosErr = new AxiosError("Request failed");
    axiosErr.response = {
      status: 400,
      statusText: "",
      data: { statusCode: 400, message: ["email must be an email"], error: "Bad Request" },
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
    vi.spyOn(apiClient, "request").mockRejectedValueOnce(axiosErr);

    const onError = vi.fn();
    const { result } = renderHook(
      () => useApiMutation({ key: "users.create", path: "/users", method: "POST" }, { onError }),
      { wrapper: makeWrapper(client) },
    );

    await act(async () => {
      await result.current.mutateAsync({ body: { email: "nope" } }).catch(() => {});
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.status).toBe(400);
    expect(result.current.error?.errors).toEqual({ email: "email must be an email" });
    expect(onError).toHaveBeenCalledWith(result.current.error);
  });
});
