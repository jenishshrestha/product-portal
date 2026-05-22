import { cn } from "@shared/lib/utils";
import type * as React from "react";

/**
 * Compound page header. Use across feature pages so titles, descriptions,
 * and right-aligned actions land on a consistent baseline.
 *
 * Promoted to shared at 2 features (products + users) — below the FDD
 * Rule of Three threshold — as a deliberate exception. The component is
 * a pure visual primitive with no domain coupling, and the user explicitly
 * required a single component for cross-feature consistency.
 *
 * Usage:
 *   <PageHeader.Root>
 *     <PageHeader.Content>
 *       <PageHeader.Title>Users</PageHeader.Title>
 *       <PageHeader.Description>Manage admin and user accounts.</PageHeader.Description>
 *     </PageHeader.Content>
 *     <PageHeader.Actions>
 *       <Button>Add user</Button>
 *     </PageHeader.Actions>
 *   </PageHeader.Root>
 */

function Root({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)} {...props} />
  );
}

function Content({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

function Title({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn("text-2xl font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

function Description({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function Actions({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2", className)} {...props} />;
}

export const PageHeader = {
  Root,
  Content,
  Title,
  Description,
  Actions,
};
