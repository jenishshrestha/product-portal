import { describe, expect, it } from "vitest";
import { interpolatePath } from "./path";

describe("interpolatePath", () => {
  it("returns the path unchanged when no params are provided", () => {
    expect(interpolatePath("/users")).toBe("/users");
  });

  it("interpolates a single path variable", () => {
    expect(interpolatePath("/users/{id}", { id: "42" })).toBe("/users/42");
  });

  it("interpolates multiple path variables", () => {
    expect(interpolatePath("/org/{org}/users/{id}", { org: "heubert", id: 7 })).toBe(
      "/org/heubert/users/7",
    );
  });

  it("url-encodes interpolated values", () => {
    expect(interpolatePath("/search/{q}", { q: "hello world" })).toBe("/search/hello%20world");
  });

  it("leaves placeholders untouched when their key is missing", () => {
    expect(interpolatePath("/users/{id}", { other: "x" })).toBe("/users/{id}");
  });
});
