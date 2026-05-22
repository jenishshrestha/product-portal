import { describe, expect, it } from "vitest";
import type { ClientSideDataSource, ServerSideDataSource } from "../types/data-table.types";
import { resolveDataSource } from "./resolveDataSource";

describe("resolveDataSource", () => {
  it("returns client sources unchanged", () => {
    const source: ClientSideDataSource<{ id: number }> = { mode: "client", data: [{ id: 1 }] };
    expect(resolveDataSource(source)).toBe(source);
  });

  it("returns server sources unchanged", () => {
    const source: ServerSideDataSource<{ id: number }> = {
      mode: "server",
      queryKey: ["x"],
      queryFn: async () => ({ data: [], total: 0 }),
    };
    expect(resolveDataSource(source)).toBe(source);
  });
});
