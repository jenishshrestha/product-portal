import { Button } from "@shared/components/ui/Button";
import { cn } from "@shared/lib/utils";
import type * as React from "react";

const DENSE = "h-9 gap-1.5 rounded-md px-3.5 text-[0.8125rem]";

export function HeaderButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button {...props} className={cn(DENSE, className)} />;
}
