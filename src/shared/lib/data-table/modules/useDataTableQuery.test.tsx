import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { DataTableQueryParams } from "../types/data-table.types";
import { useDataTableQuery } from "./useDataTableQuery";

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

type Overrides = Partial<{
  enabled: boolean;
  pageIndex: number;
  pageSize: number;
  sorting: { id: string; desc: boolean }[];
  columnFilters: { id: string; value: unknown }[];
  globalFilter: string;
  advancedFilters?: Record<string, string[]>;
}>;

function run(
  queryFn: (p: DataTableQueryParams) => Promise<{
    data: unknown[];
    total: number;
    nextCursor?: string | null;
    previousCursor?: string | null;
  }>,
  overrides: Overrides = {},
) {
  const {
    enabled = true,
    pageIndex = 0,
    pageSize = 10,
    sorting = [],
    columnFilters = [],
    globalFilter = "",
    advancedFilters,
  } = overrides;
  return renderHook(
    () =>
      useDataTableQuery({
        enabled,
        queryKey: ["users"],
        queryFn,
        pagination: { pageIndex, pageSize },
        sorting,
        columnFilters,
        globalFilter,
        advancedFilters,
      }),
    { wrapper: makeWrapper() },
  );
}

describe("useDataTableQuery", () => {
  it("translates TanStack state into DataTableQueryParams and omits empty search", async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: [], total: 0 });
    run(queryFn, {
      pageIndex: 2,
      pageSize: 25,
      sorting: [{ id: "name", desc: true }],
      columnFilters: [{ id: "status", value: "active" }],
    });
    await waitFor(() => expect(queryFn).toHaveBeenCalled());
    expect(queryFn.mock.calls[0]?.[0]).toEqual({
      page: 2,
      pageSize: 25,
      sorting: [{ id: "name", desc: true }],
      filters: [{ id: "status", value: "active" }],
      search: undefined,
      advancedFilters: undefined,
    });
  });

  it("surfaces errors via isError + error", async () => {
    const err = new Error("boom");
    const queryFn = vi.fn().mockRejectedValue(err);
    const { result } = run(queryFn);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(err);
  });
});
