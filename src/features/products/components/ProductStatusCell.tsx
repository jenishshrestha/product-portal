import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/DropdownMenu";
import { usePermissions } from "@shared/hooks";
import { cn } from "@shared/lib/utils";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProduct } from "../api/useProducts";
import { STATUS_LABELS } from "../lib/product-format";
import type { Product, ProductStatus } from "../types/product.types";
import { StatusBadge } from "./StatusBadge";

const STATUS_OPTIONS: ProductStatus[] = ["published", "pending_review", "archived"];

interface ProductStatusCellProps {
  product: Product;
}

/**
 * Inline-editable status cell for the products table. Admins get a
 * dropdown that PATCHes `status` via `useUpdateProduct`; everyone else
 * renders a static `StatusBadge`. Click events are stopped locally so
 * opening the dropdown doesn't trigger the row's navigate-to-detail.
 */
export function ProductStatusCell({ product }: ProductStatusCellProps) {
  const { isSuperadmin } = usePermissions();
  const updateProduct = useUpdateProduct();

  if (!isSuperadmin) {
    return <StatusBadge status={product.status} />;
  }

  function handleChange(next: ProductStatus) {
    if (next === product.status) {
      return;
    }
    updateProduct.mutate(
      { id: product.id, body: { status: next } },
      {
        onSuccess: () => toast.success(`Marked as ${STATUS_LABELS[next]}.`),
        onError: (error) => toast.error(error.message || "Failed to update status."),
      },
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={updateProduct.isPending}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <StatusBadge status={product.status} />
        {updateProduct.isPending && (
          <Loader2Icon className="size-3 animate-spin text-muted-foreground" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {STATUS_OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt} onSelect={() => handleChange(opt)} className="gap-2">
            <CheckIcon
              className={cn("size-3.5", product.status === opt ? "opacity-100" : "opacity-0")}
            />
            {STATUS_LABELS[opt]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
