import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { genericErrorParser } from "./generic";
import { nestJsErrorParser } from "./nestjs";

function makeAxiosError(status: number, data: unknown, message = "Request failed"): AxiosError {
  const err = new AxiosError(message);
  err.response = {
    status,
    statusText: "",
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

describe("nestJsErrorParser", () => {
  it("parses string message from HttpException body", () => {
    const err = makeAxiosError(404, {
      statusCode: 404,
      message: "User not found",
      error: "Not Found",
    });
    expect(nestJsErrorParser(err)).toEqual({ message: "User not found", status: 404 });
  });

  it("lifts class-validator string[] onto errors keyed by field", () => {
    const err = makeAxiosError(400, {
      statusCode: 400,
      error: "Bad Request",
      message: ["email must be an email", "password must be longer than 8 characters"],
    });
    const parsed = nestJsErrorParser(err);
    expect(parsed.message).toBe("Validation failed");
    expect(parsed.status).toBe(400);
    expect(parsed.errors).toEqual({
      email: "email must be an email",
      password: "password must be longer than 8 characters",
    });
  });

  it("groups multiple messages for the same field into an array", () => {
    const err = makeAxiosError(400, {
      message: ["email must be an email", "email should not be empty"],
    });
    expect(nestJsErrorParser(err).errors).toEqual({
      email: ["email must be an email", "email should not be empty"],
    });
  });

  it("falls back to axios error message when body is unrecognized", () => {
    const err = makeAxiosError(500, "unexpected", "Server exploded");
    expect(nestJsErrorParser(err)).toEqual({ message: "Server exploded", status: 500 });
  });

  it("falls back cleanly when there is no response at all", () => {
    const err = new AxiosError("Network Error");
    expect(nestJsErrorParser(err)).toEqual({ message: "Network Error", status: undefined });
  });
});

describe("genericErrorParser", () => {
  it("passes through { message, errors } shape", () => {
    const err = makeAxiosError(400, {
      message: "Validation failed",
      errors: { email: "Invalid", password: ["Too short", "Required"] },
    });
    expect(genericErrorParser(err)).toEqual({
      message: "Validation failed",
      status: 400,
      errors: { email: "Invalid", password: ["Too short", "Required"] },
    });
  });

  it("falls back to axios message when body is absent", () => {
    const err = new AxiosError("Network down");
    expect(genericErrorParser(err)).toEqual({
      message: "Network down",
      status: undefined,
      errors: undefined,
    });
  });
});
