import { describe, expect, it } from "vitest";
import { ApiError } from "../core/errors";
import type { ApiResult } from "../core/types";
import { unwrap } from "./unwrap";

describe("unwrap", () => {
  it("returns data when the result is successful", async () => {
    const result: ApiResult<{ id: number }> = {
      success: true,
      data: { id: 1 },
      status: 200,
    };
    await expect(unwrap(Promise.resolve(result))).resolves.toEqual({ id: 1 });
  });

  it("throws an ApiError carrying status and errors when the result is failed", async () => {
    const result: ApiResult<never> = {
      success: false,
      message: "Validation failed",
      status: 400,
      errors: { email: "invalid" },
    };

    await expect(unwrap(Promise.resolve(result))).rejects.toBeInstanceOf(ApiError);
    try {
      await unwrap(Promise.resolve(result));
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).message).toBe("Validation failed");
      expect((err as ApiError).errors).toEqual({ email: "invalid" });
    }
  });
});
