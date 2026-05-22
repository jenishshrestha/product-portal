import { lazy, Suspense, useCallback, useState } from "react";
import { useSuspenseProduct } from "../api/useProducts";
import { ProductActionsProvider } from "../lib/product-actions-context";
import type { Product } from "../types/product.types";
import { ProductDetailBackLink } from "./components/ProductDetailBackLink";
import { ProductDetailHeader } from "./components/ProductDetailHeader";
import { ProductDetailSidebar } from "./components/ProductDetailSidebar";
import { ProductDetailTabs } from "./components/ProductDetailTabs";
import { ProductStatusBar } from "./components/ProductStatusBar";
import type { ProductDetailTab } from "./types";

// Heavy edit modal — lazy-loaded on first Edit click.
const ProductFormModal = lazy(() =>
  import("../components/ProductFormModal").then((m) => ({ default: m.ProductFormModal })),
);

// Tab bodies are lazy so users on Overview don't pay for Admissions (~470
// LOC) or Fees. Each chunk is pulled when the tab becomes active.
const ProductOverviewTab = lazy(() =>
  import("./components/ProductOverviewTab").then((m) => ({ default: m.ProductOverviewTab })),
);
const ProductAdmissionsTab = lazy(() =>
  import("./components/ProductAdmissionsTab").then((m) => ({ default: m.ProductAdmissionsTab })),
);
const ProductFeesTab = lazy(() =>
  import("./components/ProductFeesTab").then((m) => ({ default: m.ProductFeesTab })),
);

interface ProductDetailPageProps {
  productId: string;
  tab: ProductDetailTab;
}

/**
 * Stub action handlers. Hoisted to module scope so every render of
 * `ProductDetailPage` doesn't produce new function refs — that would cause
 * `ProductActionsProvider`'s memo'd value to invalidate on every render and
 * propagate re-renders to every consumer (header + row actions + card
 * menus). Until mutation wiring lands these are dev-only logs.
 */
function stubDelete(p: Product) {
  if (import.meta.env.DEV) {
    console.log("[products] detail delete pending wiring:", p.id);
  }
}

function stubDuplicate(p: Product) {
  if (import.meta.env.DEV) {
    console.log("[products] detail duplicate pending wiring:", p.id);
  }
}

/**
 * Detail page layout — back link, header, status bar, then a 2-col grid
 * (main content + 320px sticky sidebar). The outer AppShell (`<main>` in
 * `_authenticated.tsx`) already provides viewport padding, so this page
 * renders full-width within it with no extra container.
 *
 * `useSuspenseProduct` relies on the route loader's `ensureQueryData` — by
 * the time this component mounts the cache is warm, so `product` is
 * guaranteed non-nullable and we don't need a defensive null-check.
 */
export function ProductDetailPage({ productId, tab }: ProductDetailPageProps) {
  const { data: product } = useSuspenseProduct(productId);
  const [editTarget, setEditTarget] = useState<Product | null>(null);

  // Stable reference for the edit open handler. Without useCallback this
  // would produce a new function on every render and invalidate the
  // ProductActionsProvider memo even when callers haven't changed.
  const handleEdit = useCallback((p: Product) => setEditTarget(p), []);

  return (
    <ProductActionsProvider onEdit={handleEdit} onDelete={stubDelete} onDuplicate={stubDuplicate}>
      <ProductDetailBackLink />
      <ProductDetailHeader product={product} />
      <ProductStatusBar product={product} />

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <ProductDetailTabs
            productId={productId}
            active={tab}
            intakeCount={product.admissions_requirements?.intakes?.length}
          />
          <Suspense fallback={null}>
            {tab === "overview" && <ProductOverviewTab product={product} />}
            {tab === "admissions" && (
              // `key={product.id}` resets nested state (e.g. selected English
              // exam) when the user navigates between detail pages without
              // the component unmounting.
              <ProductAdmissionsTab key={product.id} product={product} />
            )}
            {tab === "fees" && <ProductFeesTab product={product} />}
          </Suspense>
        </main>
        <aside className="lg:sticky lg:top-6">
          <ProductDetailSidebar product={product} />
        </aside>
      </div>

      {editTarget && (
        <Suspense fallback={null}>
          <ProductFormModal
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                setEditTarget(null);
              }
            }}
            initialData={editTarget}
          />
        </Suspense>
      )}
    </ProductActionsProvider>
  );
}
