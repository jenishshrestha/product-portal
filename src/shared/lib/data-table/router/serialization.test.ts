import { describe, expect, it } from "vitest";
import {
  buildAdvancedFilterUpdates,
  parseFiltersParam,
  parseSortParam,
  readAdvancedFiltersFromParams,
  serializeSortState,
} from "./serialization";

describe("sort param round-trip", () => {
  it("parses id.asc / id.desc and ignores bad input", () => {
    expect(parseSortParam("name.asc")).toEqual([{ id: "name", desc: false }]);
    expect(parseSortParam("name.desc")).toEqual([{ id: "name", desc: true }]);
    expect(parseSortParam(undefined)).toEqual([]);
  });

  it("serializes first sort entry; returns undefined when empty", () => {
    expect(serializeSortState([{ id: "name", desc: true }])).toBe("name.desc");
    expect(serializeSortState([])).toBeUndefined();
  });

  // Regression: column ids with dots (nested paths like
  // `course_details.course_name`) used to get truncated by a naive
  // `split(".")` — the id became the first segment and the direction
  // silently inverted. We now split on the last `.` only.
  it("round-trips ids that contain dots", () => {
    expect(parseSortParam("course_details.course_name.desc")).toEqual([
      { id: "course_details.course_name", desc: true },
    ]);
    expect(parseSortParam("course_details.course_name.asc")).toEqual([
      { id: "course_details.course_name", desc: false },
    ]);
    expect(serializeSortState([{ id: "course_details.course_name", desc: true }])).toBe(
      "course_details.course_name.desc",
    );
  });

  it("rejects malformed direction suffixes", () => {
    expect(parseSortParam("name.sideways")).toEqual([]);
    expect(parseSortParam("name.")).toEqual([]);
    expect(parseSortParam(".asc")).toEqual([]);
  });
});

describe("parseFiltersParam", () => {
  it("returns [] for missing or malformed input", () => {
    expect(parseFiltersParam(undefined)).toEqual([]);
    expect(parseFiltersParam("not-json")).toEqual([]);
  });
});

describe("readAdvancedFiltersFromParams", () => {
  it("extracts prefix-matched keys and splits comma-separated values", () => {
    const params = { "af.country": "USA,UK", "af.level": "grad", other: "x" };
    expect(readAdvancedFiltersFromParams(params, "af.")).toEqual({
      country: ["USA", "UK"],
      level: ["grad"],
    });
  });

  it("ignores empty values and a bare prefix", () => {
    expect(
      readAdvancedFiltersFromParams({ "af.country": "", "af.": "x", other: "y" }, "af."),
    ).toEqual({});
  });
});

describe("buildAdvancedFilterUpdates", () => {
  it("writes new values and undefines any previously-set prefixed keys that no longer apply", () => {
    const updates = buildAdvancedFilterUpdates(
      { country: ["CA"] },
      { "af.country": "USA", "af.level": "grad", other: "keep" },
      "af.",
    );
    expect(updates).toEqual({ "af.country": "CA", "af.level": undefined });
    expect(updates).not.toHaveProperty("other");
  });
});
