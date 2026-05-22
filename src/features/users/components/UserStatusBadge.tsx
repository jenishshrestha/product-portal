import { Badge } from "@shared/components/ui/Badge";

export function UserStatusBadge({ disabled }: { disabled: boolean }) {
  if (disabled) {
    return (
      <Badge variant="destructive" className="h-5">
        Disabled
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="h-5">
      Active
    </Badge>
  );
}
