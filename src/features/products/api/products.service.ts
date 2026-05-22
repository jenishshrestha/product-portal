/**
 * Service layer for products.
 *
 * Phase 1 wires the read paths to `/api/v1/products`. Mutations (create,
 * update, delete, bulk delete, toggle status) come in Phase 2 once the
 * ProductForm has been rebuilt against the v19.0.0 shape.
 *
 * Response envelopes follow the Heubert shape (see docs/backend-integration.md):
 *   single:    { "data": Product }
 *   paginated: { "data": Product[], "pagination": { page, limit, totalPages, totalResults } }
 */

import { apiFetch, unwrap } from "@shared/lib/dal";
import type {
  FilterOptions,
  PaginatedProducts,
  Product,
  ProductCreateInput,
  ProductsParams,
} from "../types/product.types";

interface EnvelopeSingle<T> {
  data: T;
}

export async function getProducts(params: ProductsParams = {}): Promise<PaginatedProducts> {
  return unwrap(
    apiFetch<PaginatedProducts>(
      { key: "products.list", path: "/api/v1/products" },
      { query: params },
    ),
  );
}

export async function getProduct(id: string): Promise<Product> {
  const envelope = await unwrap(
    apiFetch<EnvelopeSingle<Product>>(
      { key: "products.get", path: "/api/v1/products/{id}" },
      { pathParams: { id } },
    ),
  );
  return envelope.data;
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const envelope = await unwrap(
    apiFetch<EnvelopeSingle<FilterOptions>>({
      key: "products.filters",
      path: "/api/v1/products/filters",
    }),
  );
  return envelope.data;
}

export async function createProduct(body: ProductCreateInput): Promise<Product> {
  const envelope = await unwrap(
    apiFetch<EnvelopeSingle<Product>, ProductCreateInput>(
      { key: "products.create", path: "/api/v1/products", method: "POST" },
      { body },
    ),
  );
  return envelope.data;
}

/**
 * PATCH /api/v1/products/:id — backend accepts a partial body (any subset of
 * the create shape). We send the full form payload on every submit; the
 * backend diffs internally.
 */
export async function updateProduct(
  id: string,
  body: Partial<ProductCreateInput>,
): Promise<Product> {
  const envelope = await unwrap(
    apiFetch<EnvelopeSingle<Product>, Partial<ProductCreateInput>>(
      { key: "products.update", path: "/api/v1/products/{id}", method: "PATCH" },
      { pathParams: { id }, body },
    ),
  );
  return envelope.data;
}

/**
 * DELETE /api/v1/products/:id — admin-only, soft-delete (sets deletedAt on
 * the doc so it's excluded from listings). Returns 204 No Content, so we
 * don't unwrap a body.
 */
export async function deleteProduct(id: string): Promise<void> {
  await unwrap(
    apiFetch<null>(
      { key: "products.delete", path: "/api/v1/products/{id}", method: "DELETE" },
      { pathParams: { id } },
    ),
  );
}
