import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTableState } from "./useTableState";

describe("useTableState", () => {
  it("setSorting/setColumnFilters/setGlobalFilter all reset pageIndex to 0", () => {
    const { result } = renderHook(() => useTableState({ syncWithUrl: false, defaultPageSize: 10 }));
    act(() => result.current.setPagination({ pageIndex: 5, pageSize: 10 }));
    act(() => result.current.setSorting([{ id: "name", desc: false }]));
    expect(result.current.pagination.pageIndex).toBe(0);

    act(() => result.current.setPagination({ pageIndex: 4, pageSize: 10 }));
    act(() => result.current.setColumnFilters([{ id: "status", value: "active" }]));
    expect(result.current.pagination.pageIndex).toBe(0);

    act(() => result.current.setPagination({ pageIndex: 3, pageSize: 10 }));
    act(() => result.current.setGlobalFilter("ada"));
    expect(result.current.pagination.pageIndex).toBe(0);
  });

  describe("dev warning", () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = "development";
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      vi.restoreAllMocks();
    });

    it("warns when syncWithUrl is true but no RouterAdapter is mounted", () => {
      renderHook(() => useTableState({ syncWithUrl: true, defaultPageSize: 10 }));
      expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/no RouterAdapter/));
    });
  });
});
