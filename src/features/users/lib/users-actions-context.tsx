import { createContext, use, useMemo } from "react";
import type { AdminUser } from "../types/user.types";

interface UsersActions {
  /** Open the disable/re-enable confirmation dialog. Intent flips on `user.disabled`. */
  onRequestDisable: (user: AdminUser) => void;
}

const UsersActionsContext = createContext<UsersActions | null>(null);

interface UsersActionsProviderProps extends UsersActions {
  children: React.ReactNode;
}

export function UsersActionsProvider({ onRequestDisable, children }: UsersActionsProviderProps) {
  const value = useMemo(() => ({ onRequestDisable }), [onRequestDisable]);
  return <UsersActionsContext value={value}>{children}</UsersActionsContext>;
}

export function useUsersActions(): UsersActions {
  const ctx = use(UsersActionsContext);
  if (!ctx) {
    throw new Error("useUsersActions must be used within <UsersActionsProvider>");
  }
  return ctx;
}
