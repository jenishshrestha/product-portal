import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { ApiError } from "../core/errors";
import { applyApiErrorToForm } from "./applyApiErrorToForm";

interface UserForm {
  email: string;
  password: string;
}

describe("applyApiErrorToForm", () => {
  it("calls setError for each field error", () => {
    const { result } = renderHook(() => useForm<UserForm>());
    const err = new ApiError({
      success: false,
      message: "Validation failed",
      status: 400,
      errors: { email: "Invalid email", password: ["Too short"] },
    });

    act(() => applyApiErrorToForm(result.current, err));

    expect(result.current.getFieldState("email").error?.message).toBe("Invalid email");
    expect(result.current.getFieldState("password").error?.message).toBe("Too short");
  });

  it("is a no-op when the error has no field-level errors", () => {
    const { result } = renderHook(() => useForm<UserForm>());
    const err = new ApiError({
      success: false,
      message: "Server error",
      status: 500,
    });

    act(() => applyApiErrorToForm(result.current, err));

    expect(result.current.getFieldState("email").error).toBeUndefined();
    expect(result.current.getFieldState("password").error).toBeUndefined();
  });
});
