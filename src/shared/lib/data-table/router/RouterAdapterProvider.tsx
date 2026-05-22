import { createContext, type ReactNode, useContext } from "react";
import type { RouterAdapter } from "./router-adapter.types";

const RouterAdapterContext = createContext<RouterAdapter | null>(null);

export function RouterAdapterProvider({
  adapter,
  children,
}: {
  adapter: RouterAdapter;
  children: ReactNode;
}) {
  return <RouterAdapterContext.Provider value={adapter}>{children}</RouterAdapterContext.Provider>;
}

export function useRouterAdapter(): RouterAdapter | null {
  return useContext(RouterAdapterContext);
}
