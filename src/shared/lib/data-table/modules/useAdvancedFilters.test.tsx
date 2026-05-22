import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { RouterAdapterProvider } from "../router/RouterAdapterProvider";
import type { RouterAdapter } from "../router/router-adapter.types";
import type { AdvancedFilterConfig } from "../types/data-table.types";
import { useAdvancedFilters } from "./useAdvancedFilters";

const config: AdvancedFilterConfig = {
  sections: [{ key: "country", title: "Country", type: "flat" }],
  getOptions: async () => ({}),
};

function mockAdapter(initial: Record<string, unknown> = {}) {
  const params = { ...initial };
  const setParams = vi.fn((updates: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined) {
        delete params[k];
      } else {
        params[k] = v;
      }
    }
  });
  const adapter: RouterAdapter = {
    useSearchParams: () => ({ getParams: () => params, setParams }),
  };
  return { adapter, setParams };
}

describe("useAdvancedFilters — local state", () => {
  it("setSection adds values, and setting an empty array removes the section", () => {
    const { result } = renderHook(() => useAdvancedFilters(config));
    act(() => result.current.setSection("country", ["USA", "UK"]));
    expect(result.current.filters).toEqual({ country: ["USA", "UK"] });
    expect(result.current.activeCount).toBe(2);
    act(() => result.current.setSection("country", []));
    expect(result.current.filters).toEqual({});
  });

  it("enabled is true only when a config is provided", () => {
    const withConfig = renderHook(() => useAdvancedFilters(config));
    const withoutConfig = renderHook(() => useAdvancedFilters(undefined));
    expect(withConfig.result.current.enabled).toBe(true);
    expect(withoutConfig.result.current.enabled).toBe(false);
  });
});

describe("useAdvancedFilters — URL sync", () => {
  it("reads from URL params under the configured prefix and writes back on mutation", () => {
    const { adapter, setParams } = mockAdapter({ "af.country": "USA,UK" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RouterAdapterProvider adapter={adapter}>{children}</RouterAdapterProvider>
    );
    const { result } = renderHook(() => useAdvancedFilters(config, { syncWithUrl: true }), {
      wrapper,
    });
    expect(result.current.filters).toEqual({ country: ["USA", "UK"] });
    act(() => result.current.setSection("country", ["CA"]));
    expect(setParams).toHaveBeenCalledWith(expect.objectContaining({ "af.country": "CA" }));
  });

  it("falls back to local state when syncWithUrl is true but no router adapter is mounted", () => {
    const { result } = renderHook(() => useAdvancedFilters(config, { syncWithUrl: true }));
    act(() => result.current.setSection("country", ["USA"]));
    expect(result.current.filters).toEqual({ country: ["USA"] });
  });
});
