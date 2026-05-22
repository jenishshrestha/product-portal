import { Button } from "@shared/components/ui/Button";
import { Checkbox } from "@shared/components/ui/Checkbox";
import { Label } from "@shared/components/ui/Label";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/components/ui/Popover";
import type { ApiError } from "@shared/lib/dal";
import { ChevronDownIcon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { useUpdateUserRoles } from "../api/useUsers";
import type { UserRole } from "../types/user.types";

interface RoleEditPopoverProps {
  userId: string;
  current: UserRole[];
  /** Disabled state (e.g. self-row) — renders nothing. */
  disabled?: boolean;
}

/**
 * Promote/demote a user via checkboxes. Backend replaces the entire role
 * set, so to promote a `user` to admin we send `["user", "admin"]`. The
 * "user" base role is locked on (UI mirrors the backend's "at least one
 * role" rule — the only meaningful toggle today is admin).
 */
export function RoleEditPopover({ userId, current, disabled }: RoleEditPopoverProps) {
  const [open, setOpen] = useState(false);

  if (disabled) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
          Edit
          <ChevronDownIcon className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        {/* Inner body remounts each time the popover opens so `draft` is
            re-initialized from the current prop without an effect. Avoids
            the prop→state sync antipattern (rerender-derived-state-no-effect). */}
        {open && (
          <RoleEditBody
            key={userId}
            userId={userId}
            current={current}
            onClose={() => setOpen(false)}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

interface RoleEditBodyProps {
  userId: string;
  current: UserRole[];
  onClose: () => void;
}

function RoleEditBody({ userId, current, onClose }: RoleEditBodyProps) {
  const [draft, setDraft] = useState<UserRole[]>(current);
  const updateRoles = useUpdateUserRoles();
  const checkboxId = useId();

  const isAdmin = draft.includes("admin");
  const isDirty = draft.length !== current.length || draft.some((r) => !current.includes(r));

  function toggleAdmin(checked: boolean) {
    setDraft(checked ? ["user", "admin"] : ["user"]);
  }

  function onSave() {
    updateRoles.mutate(
      { id: userId, roles: draft },
      {
        onSuccess: () => {
          onClose();
          toast.success("Roles updated");
        },
        onError: (err: ApiError) => {
          if (err.status === 400) {
            toast.error(err.message || "You can't remove your own admin role.");
          } else {
            toast.error(err.message || "Failed to update roles");
          }
        },
      },
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Roles</p>
        <p className="text-xs text-muted-foreground">User is granted by default.</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox id={`${checkboxId}-user`} checked disabled />
          <Label htmlFor={`${checkboxId}-user`} className="text-sm">
            User
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${checkboxId}-admin`}
            checked={isAdmin}
            onCheckedChange={(v) => toggleAdmin(v === true)}
          />
          <Label htmlFor={`${checkboxId}-admin`} className="text-sm">
            Admin
          </Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={updateRoles.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={!isDirty || updateRoles.isPending}
        >
          {updateRoles.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
