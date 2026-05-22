import { ProductImportPage } from "@features/products";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/products/import")({
  component: ProductImportPage,
});
