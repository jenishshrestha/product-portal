import { Badge } from "@shared/components/ui/Badge";
import type { UserRole } from "../types/user.types";

const LABELS: Record<UserRole, string> = {
  admin: "Admin",
  user: "User",
};

export function RoleBadges({ roles }: { roles: UserRole[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role} variant={role === "admin" ? "default" : "secondary"} className="h-5">
          {LABELS[role]}
        </Badge>
      ))}
    </div>
  );
}
