import { useAuth } from "@shared/lib/auth/useAuth";
import { useMemo } from "react";

export function usePermissions() {
  const { user, isAuthenticated } = useAuth();
  const isSuperadmin = user?.roles?.includes("admin") ?? false;

  // Memoized so callers can safely pass the object into dep arrays without
  // triggering infinite re-renders.
  return useMemo(
    () => ({
      isAuthenticated,
      isSuperadmin,
      canDelete: isSuperadmin,
      canBulkDelete: isSuperadmin,
      canDisable: isAuthenticated,
    }),
    [isAuthenticated, isSuperadmin],
  );
}
