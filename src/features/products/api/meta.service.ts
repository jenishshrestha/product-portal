/**
 * Meta endpoints — static reference data (ISO country list, etc.).
 * Separate from products.service.ts because these live at /api/v1/meta/*
 * and have different cache behaviour (near-infinite staleTime).
 */

import { apiFetch, unwrap } from "@shared/lib/dal";
import type { Country } from "../types/product.types";

interface EnvelopeSingle<T> {
  data: T;
}

export async function getCountries(): Promise<Country[]> {
  const envelope = await unwrap(
    apiFetch<EnvelopeSingle<Country[]>>({
      key: "meta.countries",
      path: "/api/v1/meta/countries",
    }),
  );
  return envelope.data;
}
