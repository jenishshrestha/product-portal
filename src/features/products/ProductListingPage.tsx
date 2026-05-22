import { HeaderButton } from "@shared/components/HeaderButton";
import { PageHeader } from "@shared/components/PageHeader";
import { usePermissions } from "@shared/hooks";
import type {
  DataTableConfig,
  DataTableQueryParams,
  DataTableServerResponse,
} from "@shared/lib/data-table";
import { createSelectionColumn, DT } from "@shared/lib/data-table";
import { Link, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { getProducts } from "./api/products.service";
import { ProductBulkActions } from "./components/ProductBulkActions";
import { ProductCard } from "./components/ProductCard";
import { ProductExportMenu } from "./components/ProductExportMenu";
import { ProductFilterBar } from "./components/ProductFilterBar";
import { ProductResultsBar } from "./components/ProductResultsBar";
import { ProductStatsRow } from "./components/ProductStatsRow";
import { productColumns } from "./lib/columns";
import { ProductActionsProvider } from "./lib/product-actions-context";
import { paramsFromTableState } from "./lib/products-params";
import type { Product } from "./types/product.types";

// Heavy modal (Dialog + Form + RHF + Zod + Combobox + useCountries) —
// split to its own chunk, loaded on first Add click.
const ProductFormModal = lazy(() =>
  import("./components/ProductFormModal").then((m) => ({
    default: m.ProductFormModal,
  })),
);

async function productsQueryFn(
  params: DataTableQueryParams,
): Promise<DataTableServerResponse<Product>> {
  const response = await getProducts(paramsFromTableState(params));
  return {
    data: response.data,
    total: response.pagination.totalResults,
    pageCount: response.pagination.totalPages,
  };
}

export function ProductListingPage() {
  const { isSuperadmin } = usePermissions();
  const navigate = useNavigate();
  const [editTarget, setEditTarget] = useState<Product | null>(null);

  const productsConfig = useMemo<DataTableConfig<Product>>(
    () => ({
      columns: [createSelectionColumn<Product>(), ...productColumns],
      cardRenderer: (product, { isSelected, onSelect }) => (
        <ProductCard product={product} isSelected={isSelected} onSelect={onSelect} />
      ),
      dataSource: {
        mode: "server",
        queryKey: ["products", "list"] as const,
        queryFn: productsQueryFn,
      },
      pagination: {
        defaultPageSize: 10,
        pageSizeOptions: [10, 20, 30, 50],
      },
      enableSorting: true,
      enableRowSelection: true,
      syncWithUrl: true,
      getRowId: (product) => product.id,
      initialSorting: [{ id: "createdAt", desc: true }],
      onRowClick: (product) => {
        navigate({
          to: "/products/$productId",
          params: { productId: product.id },
        });
      },
    }),
    [navigate],
  );

  function handleEditModalChange(open: boolean) {
    if (!open) {
      setEditTarget(null);
    }
  }

  return (
    <ProductActionsProvider
      onEdit={setEditTarget}
      onDelete={(product) => {
        if (import.meta.env.DEV) {
          console.log("[products] delete handler pending API wiring:", product.id);
        }
      }}
      onDuplicate={(product) => {
        if (import.meta.env.DEV) {
          console.log("[products] duplicate handler pending API wiring:", product.id);
        }
      }}
    >
      <DT.Root config={productsConfig} className="space-y-4">
        <PageHeader.Root>
          <PageHeader.Content>
            <PageHeader.Title className="text-[1.375rem] tracking-[-0.02em]">
              Courses
            </PageHeader.Title>
            <ProductStatsRow />
          </PageHeader.Content>
          <PageHeader.Actions>
            <ProductExportMenu />
            {isSuperadmin && (
              <HeaderButton asChild>
                <Link to="/products/new">
                  <PlusIcon className="size-3.5" />
                  New course
                </Link>
              </HeaderButton>
            )}
          </PageHeader.Actions>
        </PageHeader.Root>

        <ProductFilterBar />

        <div className="flex items-center justify-between">
          <ProductResultsBar />
          <DT.ViewToggle />
        </div>

        <DT.Content />
        <DT.Pagination label="courses" />

        <ProductBulkActions />
      </DT.Root>

      {editTarget && (
        <Suspense fallback={null}>
          <ProductFormModal
            open={true}
            onOpenChange={handleEditModalChange}
            initialData={editTarget}
          />
        </Suspense>
      )}
    </ProductActionsProvider>
  );
}
