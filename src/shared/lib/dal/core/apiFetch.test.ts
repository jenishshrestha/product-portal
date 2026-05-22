import { apiClient } from "@shared/lib/api/client";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { genericErrorParser } from "../parsers/generic";
import { nestJsErrorParser } from "../parsers/nestjs";
import { apiFetch } from "./apiFetch";
import { configureDal } from "./config";

function axiosReject(status: number, data: unknown): AxiosError {
  const err = new AxiosError("Request failed");
  err.response = {
    status,
    statusText: "",
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

describe("apiFetch", () => {
  beforeEach(() => {
    configureDal({ errorParser: nestJsErrorParser });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns success on a 2xx response", async () => {
    vi.spyOn(apiClient, "request").mockResolvedValueOnce({
      data: { id: 1, name: "Ada" },
      status: 200,
    } as never);

    const result = await apiFetch<{ id: number; name: string }>(
      {
        key: "users.one",
        path: "/users/{id}",
      },
      { pathParams: { id: 1 } },
    );

    expect(result).toEqual({
      success: true,
      data: { id: 1, name: "Ada" },
      status: 200,
    });
  });

  it("builds the request with method, path interpolation, body, query, and headers", async () => {
    const spy = vi.spyOn(apiClient, "request").mockResolvedValueOnce({
      data: { ok: true },
      status: 201,
    } as never);

    await apiFetch(
      { key: "users.create", path: "/users/{id}/posts", method: "POST" },
      {
        pathParams: { id: 9 },
        body: { title: "hi" },
        query: { lang: "en" },
        headers: { "X-Extra": "1" },
      },
    );

    expect(spy).toHaveBeenCalledWith({
      url: "/users/9/posts",
      method: "POST",
      data: { title: "hi" },
      params: { lang: "en" },
      headers: { "X-Extra": "1" },
      responseType: undefined,
      signal: undefined,
    });
  });

  it("validates the response with a Zod schema and returns the parsed data", async () => {
    const schema = z.object({ id: z.number(), name: z.string() });
    vi.spyOn(apiClient, "request").mockResolvedValueOnce({
      data: { id: 1, name: "Ada", extra: "ignored" },
      status: 200,
    } as never);

    const result = await apiFetch({ key: "users.one", path: "/users/1" }, { schema });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 1, name: "Ada" });
    }
  });

  it("returns a failure when Zod validation fails", async () => {
    const schema = z.object({ id: z.number() });
    vi.spyOn(apiClient, "request").mockResolvedValueOnce({
      data: { id: "not a number" },
      status: 200,
    } as never);

    const result = await apiFetch({ key: "users.one", path: "/users/1" }, { schema });
    expect(result).toEqual({
      success: false,
      message: "Received invalid data format from API",
      status: 200,
    });
  });

  it("maps NestJS validation errors onto the failure result", async () => {
    vi.spyOn(apiClient, "request").mockRejectedValueOnce(
      axiosReject(400, {
        statusCode: 400,
        error: "Bad Request",
        message: ["email must be an email"],
      }),
    );

    const result = await apiFetch({ key: "users.create", path: "/users", method: "POST" });
    expect(result).toEqual({
      success: false,
      message: "Validation failed",
      status: 400,
      errors: { email: "email must be an email" },
    });
  });

  it("uses the configured parser — swapping to genericErrorParser changes output", async () => {
    configureDal({ errorParser: genericErrorParser });

    vi.spyOn(apiClient, "request").mockRejectedValueOnce(
      axiosReject(422, {
        message: "Unprocessable",
        errors: { email: ["Already taken"] },
      }),
    );

    const result = await apiFetch({ key: "users.create", path: "/users", method: "POST" });
    expect(result).toEqual({
      success: false,
      message: "Unprocessable",
      status: 422,
      errors: { email: ["Already taken"] },
    });
  });

  it("rethrows on cancellation so TanStack Query can distinguish it", async () => {
    const { CanceledError } = await import("axios");
    const cancel = new CanceledError("canceled");
    vi.spyOn(apiClient, "request").mockRejectedValueOnce(cancel);

    await expect(
      apiFetch({ key: "users.list", path: "/users" }, { signal: new AbortController().signal }),
    ).rejects.toBe(cancel);
  });
});
