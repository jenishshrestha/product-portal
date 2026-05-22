import { PRODUCT_NEW_TABS, ProductNewPage } from "@features/products/new";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  tab: z.enum(PRODUCT_NEW_TABS).catch("overview").default("overview"),
});

export const Route = createFileRoute("/_authenticated/products/new")({
  validateSearch: searchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = Route.useSearch();
  return <ProductNewPage tab={tab} />;
}
