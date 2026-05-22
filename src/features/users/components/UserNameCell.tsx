import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/Avatar";
import { useAuth } from "@shared/lib/auth/useAuth";
import type { AdminUser } from "../types/user.types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export function UserNameCell({ user }: { user: AdminUser }) {
  const { user: currentUser } = useAuth();
  const isSelf = user.id === currentUser?.id;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar className="size-7">
        <AvatarImage src={user.image ?? undefined} alt="" />
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>
      <span className="truncate text-[0.8125rem] font-medium text-foreground">{user.name}</span>
      {isSelf && <span className="text-[0.71875rem] text-muted-foreground">(you)</span>}
    </div>
  );
}
