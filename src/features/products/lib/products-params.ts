import type { DataTableQueryParams } from "@shared/lib/data-table";
import {
  PRODUCT_SORT_FIELDS,
  type ProductSortBy,
  type ProductStatus,
  type ProductsParams,
} from "../types/product.types";

const SORT_ALLOWLIST: ReadonlySet<string> = new Set(PRODUCT_SORT_FIELDS);

function coerceSortBy(id: string | undefined): ProductSortBy {
  return id && SORT_ALLOWLIST.has(id) ? (id as ProductSortBy) : "createdAt";
}

function sortedCopy(values: string[] | undefined): string[] | undefined {
  return values?.length ? [...values].sort() : undefined;
}

/**
 * Single source of truth: DataTable query params → backend `ProductsParams`.
 * Used by both the list query (which keeps `page` + `limit`) and the export
 * URL builder (which strips them — `/products/export` rejects pagination).
 */
export function paramsFromTableState(params: DataTableQueryParams): ProductsParams {
  const primarySort = params.sorting[0];
  const advanced = params.advancedFilters ?? {};
  const rawFeesMin = advanced.feesMin?.[0];
  const rawFeesMax = advanced.feesMax?.[0];
  const feesMin = rawFeesMin !== undefined ? Number(rawFeesMin) : undefined;
  const feesMax = rawFeesMax !== undefined ? Number(rawFeesMax) : undefined;
  return {
    page: params.page + 1, // DataTable is 0-based, backend is 1-based
    limit: params.pageSize,
    search: params.search || undefined,
    sortBy: coerceSortBy(primarySort?.id),
    order: primarySort ? (primarySort.desc ? "desc" : "asc") : "desc",
    country: sortedCopy(advanced.country),
    institution: sortedCopy(advanced.institution),
    studyArea: sortedCopy(advanced.studyArea),
    studyLevel: sortedCopy(advanced.studyLevel),
    qualificationType: sortedCopy(advanced.qualificationType),
    status: advanced.status?.[0] as ProductStatus | undefined,
    feesMin: feesMin !== undefined && !Number.isNaN(feesMin) ? feesMin : undefined,
    feesMax: feesMax !== undefined && !Number.isNaN(feesMax) ? feesMax : undefined,
    feesCurrency: sortedCopy(advanced.feesCurrency),
    intakeDateFrom: advanced.intakeDateFrom?.[0] || undefined,
    intakeDateTo: advanced.intakeDateTo?.[0] || undefined,
    englishTest: advanced.englishTest?.[0] || undefined,
    englishScoreMin: advanced.englishScoreMin?.[0]
      ? Number(advanced.englishScoreMin[0])
      : undefined,
  };
}

/** Strip pagination — `/products/export` streams the full result set. */
export function exportParamsFrom(params: ProductsParams): Omit<ProductsParams, "page" | "limit"> {
  const { page: _p, limit: _l, ...rest } = params;
  return rest;
}
