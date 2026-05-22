import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/components/ui/AlertDialog";
import type { ApiError } from "@shared/lib/dal";
import { toast } from "sonner";
import { useSetUserDisabled } from "../api/useUsers";
import type { AdminUser } from "../types/user.types";

interface DisableConfirmDialogProps {
  /** Target user; `null` closes the dialog. Intent (disable vs re-enable) is derived from `user.disabled`. */
  user: AdminUser | null;
  onClose: () => void;
}

/**
 * Confirms disable/re-enable. Re-enable is low-risk so we only confirm
 * disable, but we use the same dialog with different copy for symmetry.
 */
export function DisableConfirmDialog({ user, onClose }: DisableConfirmDialogProps) {
  const setDisabled = useSetUserDisabled();
  const disabling = user ? !user.disabled : false;

  function onConfirm() {
    if (!user) {
      return;
    }
    setDisabled.mutate(
      { id: user.id, disabled: disabling },
      {
        onSuccess: () => {
          toast.success(disabling ? `${user.name} disabled` : `${user.name} re-enabled`);
          onClose();
        },
        onError: (err: ApiError) => {
          toast.error(err.message || "Failed to update user");
        },
      },
    );
  }

  return (
    <AlertDialog open={user !== null} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {disabling ? `Disable ${user?.name}?` : `Re-enable ${user?.name}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {disabling
              ? "Their next API request will be rejected and they'll be signed out. They keep their role assignments and can be re-enabled later."
              : "They'll regain access on their next request."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={setDisabled.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={setDisabled.isPending}>
            {setDisabled.isPending ? "Saving…" : disabling ? "Disable" : "Re-enable"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
