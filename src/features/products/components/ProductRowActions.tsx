import { usePermissions } from "@shared/hooks";
import { DataTableRowActions, type RowAction } from "@shared/lib/data-table";
import { CopyIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useProductActions } from "../lib/product-actions-context";
import type { Product } from "../types/product.types";

/**
 * Row-click already navigates to the detail page, so View is redundant.
 * Edit stays here (dense table UX — speeds up admins iterating without a
 * detail-page hop); cards drop Edit entirely since they're `<Link>`s.
 */
export function ProductRowActions({ product }: { product: Product }) {
  const { canDelete, isSuperadmin } = usePermissions();
  const { onEdit, onDelete, onDuplicate } = useProductActions();

  const actions: RowAction<Product>[] = [{ label: "Edit", icon: PencilIcon, onClick: onEdit }];

  if (isSuperadmin) {
    actions.push({ label: "Duplicate", icon: CopyIcon, onClick: onDuplicate });
  }

  if (canDelete) {
    actions.push({
      label: "Delete",
      icon: TrashIcon,
      variant: "destructive",
      onClick: onDelete,
    });
  }

  return <DataTableRowActions row={product} actions={actions} />;
}
