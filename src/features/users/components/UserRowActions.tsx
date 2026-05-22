import { Button } from "@shared/components/ui/Button";
import { useAuth } from "@shared/lib/auth/useAuth";
import { useUsersActions } from "../lib/users-actions-context";
import type { AdminUser } from "../types/user.types";
import { RoleEditPopover } from "./RoleEditPopover";

/**
 * Per-row mutation cluster: edit roles + disable/re-enable. Hidden on the
 * current user's own row — both backend operations would 400 (self-demote /
 * self-disable lockout protection) so we keep them off the surface.
 */
export function UserRowActions({ user }: { user: AdminUser }) {
  const { user: currentUser } = useAuth();
  const { onRequestDisable } = useUsersActions();
  const isSelf = user.id === currentUser?.id;

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <RoleEditPopover userId={user.id} current={user.roles} />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onRequestDisable(user)}
      >
        {user.disabled ? "Re-enable" : "Disable"}
      </Button>
    </div>
  );
}
