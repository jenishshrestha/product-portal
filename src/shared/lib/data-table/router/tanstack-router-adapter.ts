import { useNavigate, useSearch } from "@tanstack/react-router";
import type { RouterAdapter } from "./router-adapter.types";

export function createTanStackRouterAdapter(): RouterAdapter {
  return {
    useSearchParams() {
      const search = useSearch({ strict: false }) as Record<string, unknown>;
      const navigate = useNavigate();

      return {
        getParams: () => search,
        setParams: (updates) => {
          void navigate({
            search: ((prev: Record<string, unknown>) => ({
              ...prev,
              ...updates,
            })) as never,
            replace: true,
          });
        },
      };
    },
  };
}
