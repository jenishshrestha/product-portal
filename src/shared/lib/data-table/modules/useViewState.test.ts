import type { ColumnDef } from "@tanstack/react-table";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useViewState } from "./useViewState";

const columns: ColumnDef<unknown>[] = [{ id: "name", header: "Name" }];
const cardRenderer = () => null;

describe("useViewState", () => {
  it("derives availableViews from presence of columns and cardRenderer", () => {
    const tableOnly = renderHook(() => useViewState({ columns, cardRenderer: undefined }));
    expect(tableOnly.result.current.availableViews).toEqual(["table"]);

    const cardOnly = renderHook(() => useViewState({ columns: [], cardRenderer }));
    expect(cardOnly.result.current.availableViews).toEqual(["card"]);

    const both = renderHook(() => useViewState({ columns, cardRenderer }));
    expect(both.result.current.availableViews).toEqual(["table", "card"]);
    expect(both.result.current.view).toBe("table");
  });
});
