# Phase 2+ Refinement — Port Atlas Products UX to product-portal-fe

## Context

We're extending the current product listing (DummyJSON-backed) with UX patterns from the Atlas micro-frontend products feature. Backend is being built in parallel (separate Claude session), so we'll use a local mock layer that shares the same service interface we'll later swap to real API calls. **Hardcoded login stays** — real auth + RBAC comes after products feature is done.

### Decisions (locked in)

| Dimension | Choice |
|---|---|
| Data model | **PRD shape** (name, institution, country, studyArea, studyLevel, fees, currency, branches, entryRequirements, intakes, status) — ignore Atlas's relational IDs |
| Scope | **Listing + Pagination** + **Advanced Filters** (sheet) + **Add/Edit Form** (drawer). **Skip** compare feature + PDF export |
| Design system | **Use our existing** shadcn/ui + Layout primitives. Adapt Atlas UX patterns (component structure, compound patterns) but rebuild on our stack |
| Backend stub | **Mock layer in `api/` folder** — in-memory seed data + async fns matching future real-API interface. One-line swap when backend ready |
| Auth | Hardcoded stays until products feature is complete |

### Atlas patterns we're adopting

1. **Compound component header** — `ProductPageHeader.Root / .Content / .Title / .Description / .Actions` (instead of flat div with flex)
2. **Drawer-based form** — `ProductFormDrawer` (Sheet from shadcn/ui) wrapping `ProductForm` for create/edit
3. **Advanced filters in a sheet** — `AdvancedFilterSheet` with `CheckboxAccordion` groups for each filter dimension
4. **Filter bar above grid** — search input + advanced filter button + clear filters pill chip
5. **Grid layout for product cards** — 1/2/3 column responsive grid (we already have this via DataTable's card view)
6. **Server-side pagination** — already have via DataTable; confirm mock uses same contract

### What we're NOT porting

- Compare feature (CompareCart, CompareTable, EditableCell, PDF export, MonthGridSelect, CurrencyFeeInput)
- Hierarchical product types (PRD uses flat `studyLevel` enum)
- Subject disciplines → subject areas cascade
- Institution search with infinite scroll (PRD filter is simple multi-select)
- Service-based country filter (single-tenant, no service concept)
- Atlas's own design system (`@/components`, `@heubert/ui`)
- Translation files (not needed for MVP)

---

## File Changes

### Delete

| File | Reason |
|---|---|
| `src/features/products/api/product-mapper.ts` | DummyJSON mapper — replaced by PRD-shaped mock data |

### Create

| File | Purpose |
|---|---|
| `src/features/products/api/mock-db.ts` | In-memory seed (~30 PRD-shaped products) + mutable operations |
| `src/features/products/components/ProductPageHeader.tsx` | Compound component (Root/Content/Title/Description/Actions) |
| `src/features/products/components/AdvancedFilterSheet.tsx` | Sheet with filter accordions for Country/Institution/StudyArea/StudyLevel/Fees |
| `src/features/products/components/FilterBar.tsx` | Search + Advanced Filter button + active filter chips |
| `src/features/products/components/CheckboxAccordion.tsx` | Collapsible filter group with checkboxes (reusable inside AdvancedFilterSheet) |
| `src/features/products/components/ProductFormDrawer.tsx` | Sheet wrapper for create/edit ProductForm |
| `src/features/products/components/ProductForm.tsx` | React Hook Form + Zod, PRD fields, branches useFieldArray, entry requirements useFieldArray |
| `src/features/products/components/BranchEditor.tsx` | `useFieldArray` sub-component — existing branches have read-only name (PRD rule) |
| `src/features/products/components/EntryRequirementsEditor.tsx` | `useFieldArray` sub-component for exam requirements |
| `src/features/products/lib/product.schema.ts` | Zod schema for ProductForm validation |
| `src/features/products/lib/filter-options.ts` | Helper to derive filter options from mock/API data |
| `src/features/products/hooks/use-product-filters.ts` | Orchestrates filter state (URL-synced search/filters/page) |

### Modify

| File | Change |
|---|---|
| `src/features/products/types/product.types.ts` | Replace DummyJSON types with PRD shape (BranchLocation, EntryRequirement, Product, StudyLevel enum, ProductStatus) |
| `src/features/products/api/products.service.ts` | Rewrite to call `mock-db.ts` functions (same shape as future real API) |
| `src/features/products/api/use-products.ts` | Update hooks for new params + add useCreateProduct, useUpdateProduct, useToggleStatus, useFilterOptions |
| `src/features/products/lib/columns.tsx` | PRD fields: name+institution, country, studyArea, studyLevel (badge), fees (currency-formatted), status (badge) |
| `src/features/products/components/ProductCard.tsx` | PRD fields matching the columns |
| `src/features/products/ProductListingPage.tsx` | Use new ProductPageHeader, FilterBar, AdvancedFilterSheet; drop category filter; add "Add Product" → opens ProductFormDrawer |

### Keep as-is (already correct)

- `src/shared/lib/data-table/*` — DataTable system, compound pattern, createAxiosProvider
- `src/shared/components/ui/*` — all shadcn/ui primitives (Sheet, Dialog, Form, Input, Select, Checkbox, Button, Accordion, Badge, Skeleton, Card, etc.)
- `src/features/products/components/DeleteConfirmationDialog.tsx` — already built, reuse
- `src/features/products/components/ProductRowActions.tsx` — reuse
- Auth feature, route structure, Navbar, Sidebar, theme — untouched

---

## PRD Product Type (final)

```typescript
export type StudyLevel = "undergraduate" | "postgraduate" | "certificate" | "diploma";
export type ProductStatus = "active" | "disabled";

export interface BranchLocation {
  id: string;                 // uuid
  name: string;               // "Sydney", "Kathmandu"
  country: string;
  address?: string;
}

export interface EntryRequirement {
  id: string;                 // uuid
  examName: string;           // "IELTS" | "TOEFL" | "PTE" | "CAE/C1 Advanced" | "CPE/C2 Proficiency" | "CAEL" | "OET"
  overallScore: number;
  minimumBandScores?: {
    reading?: number;
    writing?: number;
    listening?: number;
    speaking?: number;
  };
  recognized: boolean;        // false = hide from display (Massey CAEL/OET rule)
}

export interface Product {
  id: string;
  name: string;
  code: string;
  institution: string;
  country: string;
  studyArea: string;
  studyLevel: StudyLevel;
  duration: string;           // "2 years"
  fees: number;
  currency: string;           // "USD" | "NZD" | "AUD" | "GBP"
  description: string;
  branches: BranchLocation[];
  entryRequirements: EntryRequirement[];
  intakes: string[];          // ["February", "July"]
  status: ProductStatus;
  createdAt: string;          // ISO 8601
  updatedAt: string;
}

export interface FilterOptions {
  countries: string[];
  institutions: string[];
  studyAreas: string[];
  studyLevels: StudyLevel[];
}
```

---

## Mock Layer Interface

`src/features/products/api/mock-db.ts`:

```typescript
// Seed 30 PRD products across: Massey University, Uni of Sydney, Kathmandu Uni, etc.
// Mix of undergrad/postgrad/certificate/diploma. Multiple countries. Branch locations.
// Includes entry requirements per PRD rules:
//   - Massey University: CAEL + OET entries marked recognized=false
//   - BBus undergrad: CAE/C1 entries with overallScore=169, minimumBandScores all=162
//   - Postgrad: CPE/C2 entries with overallScore=176
// Exported functions return Promise<...> with ~300ms delay to simulate network

export async function getProducts(params: ProductsParams): Promise<PaginatedResponse<Product>>;
export async function getProduct(id: string): Promise<Product>;
export async function createProduct(data: Omit<Product, "id"|"createdAt"|"updatedAt">): Promise<Product>;
export async function updateProduct(id: string, data: Partial<Product>): Promise<Product>;
export async function toggleProductStatus(id: string, status: ProductStatus): Promise<Product>;
export async function deleteProduct(id: string): Promise<void>;
export async function bulkDeleteProducts(ids: string[]): Promise<{ deleted: number }>;
export async function getFilterOptions(): Promise<FilterOptions>;
```

`products.service.ts` wraps these. When backend is ready, replace mock-db imports with axios calls — service interface stays identical.

---

## Component Design

### ProductPageHeader (compound — Atlas pattern)

```tsx
<ProductPageHeader.Root>
  <ProductPageHeader.Content>
    <ProductPageHeader.Title>Products</ProductPageHeader.Title>
    <ProductPageHeader.Description>Manage educational courses</ProductPageHeader.Description>
  </ProductPageHeader.Content>
  <ProductPageHeader.Actions>
    <Button onClick={openCreate}><PlusIcon /> Add Product</Button>
  </ProductPageHeader.Actions>
</ProductPageHeader.Root>
```

### AdvancedFilterSheet (adapted)

Replaces current DT.Filter-only approach. Opens from FilterBar:

```tsx
<AdvancedFilterSheet
  open={open}
  onOpenChange={setOpen}
  filters={filters}
  onFiltersChange={setFilters}
  options={filterOptions}  // from useFilterOptions
/>
```

Inside: 4 `CheckboxAccordion` groups (Country, Institution, Study Area, Study Level) + a fee range slider.

### FilterBar

```tsx
<FilterBar
  search={search}
  onSearchChange={setSearch}
  activeFilterCount={count}
  onOpenAdvanced={() => setFilterSheetOpen(true)}
  onClear={clearAll}
/>
```

### ProductFormDrawer

Uses `Sheet` from shadcn/ui (side="right", max-w-2xl). Header: "Add Product" / "Edit Product". Body: `ProductForm`. Footer: Cancel + Save buttons.

### ProductForm

Sections (collapsible accordions inside the Sheet body for long forms):
1. **Basic Info** — name, code, institution (combobox), country (combobox), studyArea, studyLevel (select), duration, description
2. **Fees** — amount (number) + currency (select)
3. **Intakes** — multi-select checkboxes (12 months)
4. **Branches** — `BranchEditor` sub-component with `useFieldArray`
5. **Entry Requirements** — `EntryRequirementsEditor` sub-component with `useFieldArray`
6. **Status** — Active/Disabled switch

---

## Implementation Order (sequential steps)

0. **Save this plan** — Create `plans/` folder in the project. Save the contents of this plan file as `plans/01-atlas-products-port.md` so the project has a local, versioned copy of the approved plan. The file at `/home/jenish/.claude/plans/cached-stargazing-peach.md` is ephemeral — `plans/01-atlas-products-port.md` is the permanent record.
1. **Types & mock-db** — `product.types.ts` + `mock-db.ts` with seed data
2. **Service layer** — `products.service.ts` wrapping mock-db
3. **Query hooks** — `use-products.ts` with all CRUD hooks + useFilterOptions
4. **Columns + ProductCard** — update to PRD fields
5. **ProductPageHeader compound** — new file
6. **FilterBar + CheckboxAccordion + AdvancedFilterSheet** — 3 new files working together
7. **ProductForm + BranchEditor + EntryRequirementsEditor + product.schema.ts** — 4 new files
8. **ProductFormDrawer** — wraps ProductForm
9. **ProductListingPage** — wire new header + filter bar + add-button-opens-drawer flow; remove category filter
10. **Delete old `product-mapper.ts`**
11. **Verify** — lint + type-check + build + manual test

Each step = ~1 batch. After step 3, the listing still works end-to-end with new data. After step 7, filters work. After step 9, add/edit works. Step 10-11 are cleanup.

---

## Critical Files to Reference (existing utilities to reuse)

| Purpose | File |
|---|---|
| Sheet (drawer) | `src/shared/components/ui/Sheet/Sheet.tsx` |
| Form primitives | `src/shared/components/ui/Form/Form.tsx` |
| Accordion | `src/shared/components/ui/Accordion/Accordion.tsx` |
| Checkbox | `src/shared/components/ui/Checkbox/Checkbox.tsx` |
| Badge | `src/shared/components/ui/Badge/Badge.tsx` |
| DataTable compound | `src/shared/lib/data-table/` |
| Delete confirmation | `src/features/products/components/DeleteConfirmationDialog.tsx` |
| Row actions | `src/features/products/components/ProductRowActions.tsx` |
| Permissions | `src/shared/hooks/use-permissions.ts` |
| Query client + keys | `src/shared/lib/query/client.ts` |
| Layout primitives | `src/shared/components/ui/Layout/*` |

---

## Verification

After all steps:

1. `bun dev` → log in as `user@experteducation.com` / `user123`
2. Products page loads with PRD-shaped products (Massey MBA, Sydney Engineering, Kathmandu BBA, etc.)
3. Search works
4. FilterBar's "Advanced Filters" button opens the sheet
5. Select filters → applies immediately; count chip shows active filter count
6. "Clear all" removes filters
7. "Add Product" button opens the drawer; form validates, submit creates a product, drawer closes, listing refreshes
8. Row "Edit" action opens drawer with pre-filled data; branches show existing ones with read-only names, can add new editable branches
9. Entry requirements editor: add/remove entries, set scores per skill
10. Login as superadmin → Delete + Bulk Delete work with DELETE confirmation
11. `bun run type-check`, `bun run build`, `bun run lint` all pass

---

## When Real Backend is Ready

Single file change:
- `src/features/products/api/products.service.ts` → replace `import { getProducts } from "./mock-db"` with `apiClient.get("/api/products")`

Everything else (components, hooks, types, columns, forms) stays untouched.

---

## What's Deferred

- Real auth + JWT login (after products feature done, per user instruction)
- Real RBAC from backend (after auth)
- Import/Export feature (Phase 4)
- Polish pass (Phase 5): toasts, empty states, skeletons, 404 handling
