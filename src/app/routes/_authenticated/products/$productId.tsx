import { productsKeys } from "@features/products/api/products.queries";
import { getProduct } from "@features/products/api/products.service";
import { PRODUCT_DETAIL_TABS, ProductDetailPage } from "@features/products/detail";
import { ProductDetailError } from "@features/products/detail/components/ProductDetailError";
import { ProductDetailSkeleton } from "@features/products/detail/components/ProductDetailSkeleton";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  tab: z.enum(PRODUCT_DETAIL_TABS).catch("overview").default("overview"),
});

export const Route = createFileRoute("/_authenticated/products/$productId")({
  // Validate + default the `?tab=` param. `.catch("overview")` means an
  // unknown or missing tab normalizes to overview without throwing.
  validateSearch: searchSchema,
  // Block navigation until the product is in the cache. Prevents a loading
  // flicker on click-through from the listing. Same queryKey + fetcher as
  // useProduct, so the subsequent hook read is instant.
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData({
      queryKey: productsKeys.detail(params.productId),
      queryFn: () => getProduct(params.productId),
    }),
  // `pendingMs: 0` so the skeleton appears immediately on cold cache — any
  // longer and we'd get a white flash before the blocks render.
  pendingMs: 0,
  pendingComponent: ProductDetailSkeleton,
  errorComponent: ProductDetailError,
  component: RouteComponent,
});

function RouteComponent() {
  const { productId } = Route.useParams();
  const { tab } = Route.useSearch();
  return <ProductDetailPage productId={productId} tab={tab} />;
}
