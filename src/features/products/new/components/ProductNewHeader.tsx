import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/DropdownMenu";
import { FormControl, FormField, FormItem, FormMessage } from "@shared/components/ui/Form";
import { usePermissions } from "@shared/hooks";
import { cn } from "@shared/lib/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { PRODUCT_STATUSES, type ProductFormValues } from "../../lib/product.schema";
import type { ProductStatus } from "../../types/product.types";

// Verb-style dropdown labels the admin uses to move a draft into a state.
// Intentionally distinct from `STATUS_LABELS` (which describes *what a
// record is*) — here we're presenting *what clicking does*.
const STATUS_ACTION_LABELS: Record<ProductStatus, string> = {
  published: "Publish",
  pending_review: "Pending Review",
  archived: "Archive",
};

// Semantic color per status. Both the trigger button and the dropdown item
// colored dot read from here so the currently-selected state tints the
// header in a glanceable way.
const STATUS_COLORS: Record<ProductStatus, { trigger: string; dot: string }> = {
  published: {
    trigger: "border-transparent bg-success-soft text-success-strong hover:bg-success-soft/80",
    dot: "bg-success-strong",
  },
  pending_review: {
    trigger: "border-transparent bg-warning-soft text-warning hover:bg-warning-soft/80",
    dot: "bg-warning",
  },
  archived: {
    trigger: "border-border bg-muted text-muted-foreground hover:bg-muted/80",
    dot: "bg-muted-foreground",
  },
};

const TRIGGER_BASE =
  "inline-flex h-[34px] items-center justify-center gap-1.5 rounded-md border px-3.5 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 whitespace-nowrap";

/**
 * New-course page header. The title is an inline `Input` bound to the
 * `name` field — typing directly in the h1 slot reads like editing a
 * document title rather than filling out a form field. The only other
 * element in the header is the status trigger on the right.
 *
 * Status trigger is a colored pill dropdown (Publish / Pending Review /
 * Archive). Non-admins see a static pill — the backend coerces non-admin
 * creates to `pending_review` anyway.
 */
export function ProductNewHeader() {
  const { isSuperadmin } = usePermissions();
  const form = useFormContext<ProductFormValues>();
  const status = form.watch("status") ?? "pending_review";
  const palette = STATUS_COLORS[status];

  function handleStatusChange(next: ProductStatus) {
    form.setValue("status", next, { shouldDirty: true });
  }

  return (
    <header className="mb-4 flex items-start justify-between gap-8">
      <div className="min-w-0 flex-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <input
                  {...field}
                  type="text"
                  placeholder="Course name"
                  aria-label="Course name"
                  className="w-full border-none bg-transparent p-0 text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground outline-none placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isSuperadmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(TRIGGER_BASE, "cursor-pointer", palette.trigger)}
              aria-label="Change status"
            >
              <span className={cn("size-1.5 rounded-full", palette.dot)} aria-hidden />
              {STATUS_ACTION_LABELS[status]}
              <ChevronDownIcon className="size-3.5 opacity-80" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PRODUCT_STATUSES.map((opt) => {
                const optPalette = STATUS_COLORS[opt];
                return (
                  <DropdownMenuItem
                    key={opt}
                    onSelect={() => handleStatusChange(opt)}
                    className="gap-2"
                  >
                    <CheckIcon
                      className={cn("size-3.5", status === opt ? "opacity-100" : "opacity-0")}
                    />
                    <span className={cn("size-1.5 rounded-full", optPalette.dot)} aria-hidden />
                    {STATUS_ACTION_LABELS[opt]}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span role="status" className={cn(TRIGGER_BASE, palette.trigger)}>
            <span className={cn("size-1.5 rounded-full", palette.dot)} aria-hidden />
            {STATUS_ACTION_LABELS[status]}
          </span>
        )}
      </div>
    </header>
  );
}
