# DataTable System

A config-driven, modular data table system built on TanStack Table v8.
Two ways to use it: **compound composition** (recommended) or **headless hook**.

Everything lives in one place: `src/shared/lib/data-table/`.

---

## How It Works (The Big Picture)

Think of the DataTable as a restaurant:

- **You** (the developer) are the customer — you decide what to order
- **The config** is your order — "I want a table with search, filters, and pagination"
- **`DT.Root`** is the kitchen — it reads your order and prepares everything
- **`DT.Toolbar`, `DT.Content`, `DT.Pagination`** are the dishes — you pick which ones to put on the table

```
Your Page
  └── DT.Root (takes your config, sets everything up)
        ├── DT.Toolbar (search bar + filter buttons)
        ├── DT.Content (the actual table or card grid)
        └── DT.Pagination (page numbers)
```

**The golden rule**: Include a component = enable the feature. Remove it = disable it. No boolean flags needed.

---

## Quick Start

### Step 1: Define your data type

This tells TypeScript what shape your data looks like.

```typescript
// features/users/user.types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive";
}
```

### Step 2: Define columns

Columns tell the table what to display and how. Each column needs an `accessorKey` (which field to show) and a `header` (what the column title looks like).

```typescript
// features/users/lib/columns.tsx
import { DataTableColumnHeader } from "@shared/lib/data-table";
import type { DataTableColumnDef } from "@shared/lib/data-table";
import type { User } from "../user.types";

export const userColumns: DataTableColumnDef<User>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    size: 60,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <Badge>{row.getValue("status")}</Badge>,
  },
];
```

### Step 3: Create the config

The config object is where you tell the DataTable everything it needs to know — what columns to show, where to fetch data from, and which features to enable.

```typescript
// features/users/api/users-table.config.ts
import type { DataTableConfig } from "@shared/lib/data-table";
import type { User } from "../user.types";
import { userColumns } from "../lib/columns";

export const usersTableConfig: DataTableConfig<User> = {
  columns: userColumns,
  dataSource: {
    mode: "provider",    // uses the global DataProvider (set up in __root.tsx)
    resource: "/users",  // the API endpoint
  },
  pagination: { defaultPageSize: 10 },
  enableSorting: true,
  syncWithUrl: true,     // table state saved in URL (back button works!)
};
```

### Step 4: Build the page

This is where you compose the table UI. Think of it like building with LEGO blocks.

```tsx
// features/users/UsersPage.tsx
import { DT } from "@shared/lib/data-table";
import { usersTableConfig } from "./api/users-table.config";

export function UsersPage() {
  return (
    <DT.Root config={usersTableConfig}>
      <DT.Toolbar>
        <DT.Search placeholder="Search users..." />
      </DT.Toolbar>
      <DT.Content />
      <DT.Pagination />
    </DT.Root>
  );
}
```

That's it. Search, pagination, sorting, loading skeletons, and empty states all work out of the box.

---

## Data Source Modes

There are four ways to connect a table to data. Pick the one that fits your situation.

### mode: "provider" (recommended)

The table talks to your API through a **DataProvider** — a universal adapter that handles request building and response parsing. You configure the provider once in `__root.tsx`, then every table just declares which resource to fetch.

```typescript
dataSource: {
  mode: "provider",
  resource: "/users",  // the provider knows your base URL, auth, params
}
```

**When to use**: Most of the time. This is the default for production apps.

### mode: "api" (convenience shortcut)

For simple REST APIs where you declare the URL and param mapping inline. No provider setup needed.

```typescript
dataSource: {
  mode: "api",
  resource: "https://dummyjson.com/users/search",
  pagination: { style: "offset", skipParam: "skip", limitParam: "limit" },
  sort: { style: "flat", sortByParam: "sortBy", orderParam: "order" },
  searchParam: "q",
  response: { dataPath: "users", totalPath: "total" },
}
```

**When to use**: Quick prototypes, external APIs, or when you don't want to set up a provider.

### mode: "server" (full control)

You write the fetch function yourself.

```typescript
dataSource: {
  mode: "server",
  queryKey: ["users"],
  queryFn: async (params) => {
    const res = await fetch(`/api/users?page=${params.page}&size=${params.pageSize}`);
    const json = await res.json();
    return { data: json.items, total: json.totalCount };
  },
}
```

**When to use**: Non-standard APIs, complex data transformations, or when other modes don't fit.

### mode: "client" (static data)

For data that's already in memory. Sorting, filtering, and pagination happen client-side. Zero API calls after initial load.

```typescript
dataSource: {
  mode: "client",
  data: users,   // User[]
}
```

**When to use**: Small datasets (<1000 rows), data loaded from a parent component, or offline-first apps.

---

## Compound Composition (The DT Namespace)

The `DT` namespace gives you building blocks. Wrap everything in `DT.Root`, then compose features as children.

### Available components

| Component | What it does | Required props |
|-----------|-------------|----------------|
| `DT.Root` | Sets up the table, provides context to children | `config` |
| `DT.Content` | Renders the table (or card grid, or skeleton, or empty state — automatically) | None |
| `DT.Toolbar` | Container for search + filters. Can auto-render from config or accept children | None or `children` |
| `DT.Search` | Debounced search input | None |
| `DT.Filter` | Multi-select checkbox filter (like "Status: Active, Inactive") | `column`, `title`, `options` |
| `DT.SingleFilter` | Single-select radio filter (like "Gender: Male") | `column`, `title`, `options` |
| `DT.RangeFilter` | Min/max number range filter | `column`, `title` |
| `DT.AdvancedFilter` | Sheet-based panel for column-scoped filters (legacy) | None |
| `DT.FilterBar` | Combined search input + advanced-filter trigger button (see [Advanced Filters](#advanced-filters)) | None |
| `DT.AdvancedFilterSheet` | Multi-section filter drawer (usually rendered by `DT.FilterBar`) | `open`, `onOpenChange` |
| `DT.FilterTags` | Shows active filters as removable chips | None |
| `DT.Pagination` | Page numbers + rows-per-page selector | None |
| `DT.BulkBar` | Floating bar when rows are selected (for bulk actions) | `children` |
| `DT.ViewToggle` | Switch between table view and card view | None |
| `DT.ViewOptions` | Column visibility dropdown ("Show/hide columns") | None |

### Auto vs Manual Toolbar

**Auto mode** — `DT.Toolbar` reads from `config.toolbar` and renders everything:

```tsx
// Config
toolbar: {
  search: { placeholder: "Search..." },
  filters: [
    { column: "status", type: "multi-select", options: statusOptions },
  ],
  columnToggle: true,
},

// JSX — just drop it in
<DT.Toolbar />
```

**Manual mode** — pass children to control exactly what appears:

```tsx
<DT.Toolbar>
  <DT.Search placeholder="Search..." />
  <DT.Filter column="status" title="Status" options={statusOptions} />
  <DT.ViewOptions />
</DT.Toolbar>
```

### Full example

```tsx
import { DT, useDataTableContext, exportCurrentPage } from "@shared/lib/data-table";
import { Button } from "@shared/components/ui/Button";

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function ExportButton() {
  const { table } = useDataTableContext<User>();
  return (
    <Button onClick={() => exportCurrentPage(table, { filename: "users" })}>
      Export CSV
    </Button>
  );
}

export function UsersPage() {
  return (
    <DT.Root config={usersTableConfig} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex gap-2">
          <DT.ViewToggle />
          <ExportButton />
        </div>
      </div>

      <DT.Toolbar>
        <DT.Search placeholder="Search users..." />
        <DT.Filter column="status" title="Status" options={statusOptions} />
      </DT.Toolbar>

      <DT.FilterTags />
      <DT.Content />
      <DT.Pagination />

      <DT.BulkBar>
        <Button>Export Selected</Button>
        <Button variant="destructive">Delete</Button>
      </DT.BulkBar>
    </DT.Root>
  );
}
```

### Using context in custom components

Any component inside `DT.Root` can access table state. This is how you build custom features:

```tsx
import { useDataTableContext } from "@shared/lib/data-table";

function SelectedCount() {
  const { table } = useDataTableContext();
  const count = table.getFilteredSelectedRowModel().rows.length;
  return <span>{count} selected</span>;
}
```

### Custom rendering with DT.Content

Override loading/empty/table rendering with a render prop:

```tsx
<DT.Content>
  {({ table, isLoading, isEmpty }) => (
    isLoading ? <MyCustomSkeleton /> :
    isEmpty ? <MyCustomEmpty /> :
    <DataTable table={table} />
  )}
</DT.Content>
```

---

## Advanced Filters

The advanced-filter system adds a **drawer-based, multi-section filter panel** to any table. It lives entirely inside the DataTable — state, options, URL sync, and query-key invalidation are all managed automatically.

### When to use it

- More than 2-3 filter dimensions (e.g., Country + Institution + Category + Level)
- Filter options come from an API (dynamic lists)
- You want a slide-out panel instead of inline dropdowns
- Filters need to affect server-side pagination

### Mental model

1. You declare **sections** in config (`country`, `institution`, `studyLevel`, ...)
2. You provide an **async options loader** — DT calls it and caches via React Query
3. User opens the sheet, checks boxes — DT tracks the state
4. Every state change bumps the query key, triggering a fresh fetch
5. Your `queryFn` reads the current selections from `params.advancedFilters`

### Step 1: Declare the filter config

Add an `advancedFilters` block to your `DataTableConfig`:

```typescript
import type { DataTableConfig, AdvancedFilterConfig } from "@shared/lib/data-table/data-table.types";

const advancedFilters: AdvancedFilterConfig = {
  // Each section becomes one collapsible accordion in the sheet
  sections: [
    {
      type: "flat",                         // simple checkbox list
      key: "country",                        // this key appears in params.advancedFilters
      title: "Country",
      searchPlaceholder: "Search countries...",
      defaultOpen: true,
    },
    {
      type: "flat",
      key: "institution",
      title: "Institution",
    },
    {
      type: "hierarchical",                  // parent + children with indeterminate state
      key: "studyArea",
      title: "Study Area",
      groupsFrom: (options) => [
        { name: "Business", items: ["Management", "Finance"] },
        { name: "Sciences", items: ["Biology", "Physics"] },
      ],
    },
  ],

  // Async options loader. DT calls this when the sheet first opens,
  // caches result for 10 minutes, and shares with all sections.
  getOptions: async () => {
    const response = await fetch("/api/products/filters");
    const options = await response.json();
    return {
      country: options.countries,          // string[]
      institution: options.institutions,
      // Label/value pairs when display ≠ stored value:
      studyLevel: [
        { label: "Undergraduate", value: "undergraduate" },
        { label: "Postgraduate",  value: "postgraduate"  },
      ],
    };
  },

  queryKey: ["products", "filter-options"], // optional — defaults to a generic key
};

const productsConfig: DataTableConfig<Product> = {
  columns: [...],
  dataSource: { mode: "server", queryFn: productsQueryFn, queryKey: ["products", "list"] },
  advancedFilters,                          // ← wire it here
};
```

### Step 2: Read filters in your queryFn

DT passes the current filter state on `params.advancedFilters`:

```typescript
async function productsQueryFn(
  params: DataTableQueryParams,
): Promise<DataTableServerResponse<Product>> {
  const filters = params.advancedFilters ?? {};

  const response = await fetch("/api/products", {
    method: "GET",
    body: JSON.stringify({
      page: params.page + 1,                // DT is 0-indexed; adjust for 1-indexed APIs
      limit: params.pageSize,
      search: params.search,
      country: filters.country,              // string[] | undefined
      institution: filters.institution,
      studyArea: filters.studyArea,
      studyLevel: filters.studyLevel,
    }),
  });

  const json = await response.json();
  return { data: json.data, total: json.total };
}
```

Filters are typed as `Record<string, string[]>` — the keys match the `section.key` values from the config.

### Step 3: Render the FilterBar

`DT.FilterBar` is the user-facing UI. Drop it in the toolbar:

```tsx
<DT.Root config={productsConfig} className="space-y-4">
  <DT.Toolbar className="flex items-center gap-2">
    <DT.FilterBar searchPlaceholder="Search products..." />
    <div className="ml-auto flex items-center gap-2">
      <DT.ViewToggle />
    </div>
  </DT.Toolbar>
  <DT.Content />
  <DT.Pagination />
</DT.Root>
```

`DT.FilterBar` renders:
- A search input wired to DT's `globalFilter` state
- A **Filters** button with active-count badge (only appears if `advancedFilters` is in config)
- A **Clear** button that clears both search and filter selections

The sheet opens on Filters click. DT renders its contents automatically from your `sections` config.

### Section types

#### `flat` — simple checkbox list

```typescript
{ type: "flat", key: "country", title: "Country", searchPlaceholder: "Search..." }
```

Renders: collapsible accordion with per-section search and highlighted matches.

#### `hierarchical` — parent/children with indeterminate state

```typescript
{
  type: "hierarchical",
  key: "studyArea",
  title: "Study Area",
  groupsFrom: (options) => [
    { name: "Business", items: ["Management", "Finance"] },
    { name: "Sciences", items: ["Biology", "Physics"] },
  ],
}
```

Parent checkbox shows `indeterminate` state when some children are selected. Toggling the parent selects/deselects all children.

If you omit `groupsFrom`, DT treats `options[key]` as a single flat group with the section title as the group name.

### Programmatic access

Any component inside `DT.Root` can read or modify filter state via the `useDataTableAdvancedFilters()` hook:

```tsx
import { useDataTableAdvancedFilters } from "@shared/lib/data-table";

function ActiveFilterCount() {
  const advanced = useDataTableAdvancedFilters();
  return <span>{advanced.activeCount} filters active</span>;
}

function ClearAllButton() {
  const advanced = useDataTableAdvancedFilters();
  return <Button onClick={advanced.clearAll}>Clear all filters</Button>;
}
```

Hook API:

| Field | Type | Purpose |
|-------|------|---------|
| `filters` | `Record<string, string[]>` | Current selections |
| `activeCount` | `number` | Total selected values across all sections |
| `setSection(key, values)` | fn | Replace a section's selections |
| `setFilters(filters)` | fn | Replace the entire filter state |
| `clearSection(key)` | fn | Clear one section |
| `clearAll()` | fn | Clear everything |
| `enabled` | `boolean` | `true` if `advancedFilters` is configured |

### Options loader best practices

- **Always async** — so it works with real APIs out of the box
- **Return once** — return a single object with all sections' options (one network round trip)
- **Cache with queryKey** — set `queryKey: ["my-feature", "filter-options"]` to share the cache across re-renders
- **Lazy load** — options fetch only when the sheet first opens (`enabled` is keyed to `open`)

### What DT does for you

- Stores selection state (no page-level `useState` needed)
- Rebuilds the React Query key on every selection change → triggers fresh data fetch
- Caches filter options for 10 minutes via React Query
- Resets pagination when a filter changes (so you don't land on a stale page 7)
- Renders section UI based on `type` (no custom rendering needed for common cases)

### Relationship to existing `DT.Filter` / `DT.Search`

- `DT.Search` and `DT.Filter` still work — they're toolbar-level, column-scoped filters
- `DT.FilterBar` + `advancedFilters` is a separate opt-in layer for multi-dimensional filtering
- You can use both simultaneously: `DT.Filter` for a quick "Status" toggle, `DT.FilterBar` for deeper filtering

### Full working example

See `src/features/products/ProductListingPage.tsx` for a complete implementation with real mock data.

---

## Headless Hook (useDataTable)

For fully custom layouts where compound composition doesn't fit. You get the raw table instance and build everything yourself.

```tsx
import { useDataTable, DataTable, DataTablePagination, DataTableToolbar } from "@shared/lib/data-table";

export function CustomPage() {
  const {
    table,
    isLoading,
    isFetching,
    isEmpty,
    globalFilter,
    setGlobalFilter,
  } = useDataTable(config);

  return (
    <div>
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
      />
      {isLoading ? <Skeleton /> : <DataTable table={table} isFetching={isFetching} />}
      <DataTablePagination table={table} />
    </div>
  );
}
```

---

## DataProvider System

### What's a DataProvider?

A DataProvider is a translator between your table and your API. It knows how to:
- Build the right URL with pagination, sorting, and filter params
- Parse the response to extract data and total count
- Handle auth headers

You set it up once, and every table reuses it.

### Global provider setup

Set up once in `__root.tsx`. Every `mode: "provider"` table uses this by default.

```tsx
// app/routes/__root.tsx
import {
  applyMiddleware,
  createAxiosProvider,
  createTanStackRouterAdapter,
  DataProviderRegistry,
  loggingMiddleware,
  RouterAdapterProvider,
} from "@shared/lib/data-table";
import { apiClient } from "@shared/lib/api/client";

// Router adapter (for URL sync)
const routerAdapter = createTanStackRouterAdapter();

// Data provider (for API calls)
const dataProvider = applyMiddleware(
  import.meta.env.DEV ? [loggingMiddleware()] : [],
  createAxiosProvider(apiClient),
);

function RootComponent() {
  return (
    <RouterAdapterProvider adapter={routerAdapter}>
      <DataProviderRegistry provider={dataProvider}>
        <Outlet />
      </DataProviderRegistry>
    </RouterAdapterProvider>
  );
}
```

### Built-in providers

#### REST Provider (zero dependencies)

Uses `globalThis.fetch`. No Axios needed.

```typescript
import { createRestProvider } from "@shared/lib/data-table";

const provider = createRestProvider({
  baseUrl: "/api/v1",
  headers: () => ({ Authorization: `Bearer ${getToken()}` }),
  pagination: { style: "offset", skipParam: "skip", limitParam: "limit" },
  sort: { style: "flat", sortByParam: "sortBy", orderParam: "order" },
  response: { dataPath: "data", totalPath: "total" },
});
```

#### Axios Provider

Wraps an Axios instance. Preserves all interceptors (auth, error handling).

```typescript
import { createAxiosProvider } from "@shared/lib/data-table";

const provider = createAxiosProvider(apiClient, {
  pagination: { style: "offset" },
  response: { dataPath: "data", totalPath: "meta.total" },
});
```

#### GraphQL Provider

Each resource needs its own query, variables builder, and response transformer.

```typescript
import { createGraphQLProvider } from "@shared/lib/data-table";

const provider = createGraphQLProvider({
  endpoint: "https://api.example.com/graphql",
  resources: {
    "/products": {
      query: `query Products($first: Int) { products(first: $first) { ... } }`,
      variables: (params) => ({ first: params.pagination.limit }),
      transformResponse: (data) => ({
        data: data.products.edges.map((e) => e.node),
        pagination: { type: "cursor", nextCursor: data.products.pageInfo.endCursor },
        total: data.products.totalCount,
      }),
    },
  },
});
```

#### Custom Provider (any protocol)

Implement the `DataProvider` interface directly for non-standard backends.

```typescript
import type { DataProvider } from "@shared/lib/data-table";

const customProvider: DataProvider = {
  async getList(params) {
    const result = await mySDK.query({
      table: params.resource,
      offset: params.pagination.type === "offset" ? params.pagination.offset : 0,
      limit: params.pagination.type === "offset" ? params.pagination.limit : 20,
    });
    return {
      data: result.rows,
      total: result.totalCount,
      pagination: { type: "offset" },
    };
  },
};
```

### Middleware

Middlewares wrap a provider to add behavior. They compose left-to-right (first = outermost).

```typescript
import {
  applyMiddleware,
  loggingMiddleware,
  errorNormalizerMiddleware,
  retryMiddleware,
} from "@shared/lib/data-table";

const provider = applyMiddleware(
  [
    loggingMiddleware(),                              // logs timing + row count
    errorNormalizerMiddleware(),                       // standardizes error format
    retryMiddleware({ maxRetries: 2, delay: 1000 }),   // retries on 5xx
  ],
  createAxiosProvider(apiClient),
);
```

| Middleware | What it does |
|-----------|-------------|
| `loggingMiddleware()` | Logs `[DataProvider] /users getList: 142ms, 10 rows` |
| `errorNormalizerMiddleware()` | Wraps any error into a standard `DataProviderError` |
| `retryMiddleware(opts)` | Retries on 5xx with exponential backoff |
| `validationMiddleware(schema)` | Validates each row with a Zod schema |

---

## Column Definitions

### Basic column

```typescript
{
  accessorKey: "name",
  header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
}
```

### Custom cell rendering

```typescript
{
  accessorKey: "status",
  header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
  cell: ({ row }) => (
    <Badge variant={row.getValue("status") === "active" ? "default" : "secondary"}>
      {row.getValue("status")}
    </Badge>
  ),
}
```

### Computed column

```typescript
{
  id: "fullName",
  accessorFn: (row) => `${row.firstName} ${row.lastName}`,
  header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
}
```

### Column meta options

```typescript
{
  accessorKey: "notes",
  meta: {
    label: "Notes",            // shown in column visibility dropdown
    hiddenByDefault: true,     // hidden until user enables it
    exportable: true,          // included in CSV export
  },
}
```

### Row actions column

```typescript
import { DataTableRowActions } from "@shared/lib/data-table";

const actions = [
  { label: "View", icon: EyeIcon, onClick: (row) => navigate(`/users/${row.id}`) },
  { label: "Edit", icon: PencilIcon, onClick: (row) => navigate(`/users/${row.id}/edit`) },
  { label: "Delete", icon: TrashIcon, variant: "destructive", onClick: (row) => deleteUser(row.id) },
];

// Add as last column:
{
  id: "actions",
  cell: ({ row }) => <DataTableRowActions row={row.original} actions={actions} />,
  enableSorting: false,
  enableHiding: false,
  size: 40,
}
```

### Selection column

```typescript
import { createSelectionColumn } from "@shared/lib/data-table";

const columns = [createSelectionColumn<User>(), ...userColumns];
```

Requires `enableRowSelection: true` in the config.

---

## Router Adapter (URL Sync)

The DataTable can sync its state (page, sort, filters, search) to the URL. This is powered by a **RouterAdapter** — a small interface that reads/writes URL params.

### How it works

```
User sorts by "Name" → table updates URL → ?sort=name.asc
User hits Back button → URL changes → table reads new state
```

### Built-in adapter (TanStack Router)

This project uses TanStack Router. The adapter is already set up in `__root.tsx`:

```tsx
import { createTanStackRouterAdapter, RouterAdapterProvider } from "@shared/lib/data-table";

const routerAdapter = createTanStackRouterAdapter();

<RouterAdapterProvider adapter={routerAdapter}>
  <App />
</RouterAdapterProvider>
```

### Next.js / other frameworks

Write a ~15-line adapter:

```typescript
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { RouterAdapter } from "@shared/lib/data-table";

export const nextJsRouterAdapter: RouterAdapter = {
  useSearchParams() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    return {
      getParams: () => Object.fromEntries(searchParams.entries()),
      setParams: (updates) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
          if (value === undefined) params.delete(key);
          else params.set(key, String(value));
        }
        router.replace(`${pathname}?${params.toString()}`);
      },
    };
  },
};
```

### Disabling URL sync

```typescript
syncWithUrl: false,  // table state stays in React state only
```

### Multiple tables on one page

```typescript
// Table 1
syncWithUrl: true, urlParamPrefix: "users",    // ?users_page=2&users_sort=name.asc

// Table 2
syncWithUrl: true, urlParamPrefix: "orders",   // ?orders_page=1
```

---

## Library File Structure

Everything lives in `src/shared/lib/data-table/`:

```
src/shared/lib/data-table/
  index.ts              ← single import point for consumers

  components/           ← UI components (table, filters, pagination, etc.)
    DataTable.tsx           table renderer
    DataTableSearch.tsx     debounced search input
    DataTablePagination.tsx page numbers + page size
    DataTableColumnHeader.tsx  sortable column header
    DataTableFacetedFilter.tsx multi-select filter
    DataTableSingleFilter.tsx  single-select filter
    DataTableRangeFilter.tsx   min/max range filter
    DataTableAdvancedFilter.tsx  sheet-based filter panel
    DataTableFilterTags.tsx    active filter chips
    DataTableViewToggle.tsx    table/card view switch
    DataTableViewOptions.tsx   column visibility
    DataTableBulkBar.tsx       floating bulk action bar
    DataTableRowActions.tsx    per-row action dropdown
    DataTableCardGrid.tsx      card grid layout
    DataTableEmpty.tsx         empty state
    DataTableSkeleton.tsx      loading skeleton
    DataTableToolbar.tsx       toolbar (auto + manual modes)
    DataTableContext.tsx        4 React contexts for perf
    DataTableRoot.tsx           root provider component
    DataTableContent.tsx        smart content renderer

  modules/              ← hook decomposition (useDataTable internals)
    useDataTable.ts         main hook (thin orchestrator)
    useDataTableQuery.ts    React Query wrapper
    useViewState.ts         view toggle state
    useDataSource.ts        data source resolution
    useTableState.ts        pagination/sort/filter/search state
    useServerData.ts        server query + loading flags
    useTableInstance.ts     TanStack Table wiring

  core/                 ← provider framework
    DataProviderRegistry.tsx  global provider context
    DataTableProvider.tsx     legacy adapter context
    data-provider.types.ts    DataProvider interface
    data-provider-error.ts    error normalization
    data-provider-middleware.ts  middleware composition
    resolveDataSource.ts      mode:"api" resolver
    resolveProviderDataSource.ts  mode:"provider" resolver

  providers/            ← built-in provider implementations
    rest-provider.ts        fetch-based REST
    axios-provider.ts       Axios wrapper
    graphql-provider.ts     GraphQL
    legacy-adapter-bridge.ts  backwards compat bridge

  middleware/            ← built-in middleware
    logging.ts, retry.ts, error-normalizer.ts, validation.ts

  router/               ← framework-agnostic URL sync
    RouterAdapterProvider.tsx  context for router adapter
    tanstack-router-adapter.ts  TanStack Router implementation
    useUrlSyncedState.ts       generic URL-synced state
    serialization.ts           sort/filter URL encoding

  types/                ← type definitions
    data-table.types.ts

  schemas/              ← validation schemas
    data-table.schema.ts

  utils/                ← standalone utilities
    export-csv.ts
```

**Consumer import**: everything comes from one path:

```typescript
import { DT, useDataTable, DataTableColumnHeader } from "@shared/lib/data-table";
import type { DataTableConfig, DataTableColumnDef } from "@shared/lib/data-table";
```

---

## Checklist: Adding a New Table

1. Define your data type (`*.types.ts`)
2. Define column definitions (`lib/columns.tsx`)
3. Create the config (`api/*-table.config.ts`)
4. If you need multi-section filtering, add an `advancedFilters` block to the config (see [Advanced Filters](#advanced-filters))
5. Build the page with `DT.Root` + compound children
6. If using advanced filters, drop `<DT.FilterBar />` into the toolbar
7. Create a route in `app/routes/`
8. Test: data loads, sorting works, pagination works, URL sync works, filter sheet opens and affects results

---

## Working Examples

| Route | What it demonstrates |
|-------|---------------------|
| `/demo-showcase` | All 5 data source modes: custom provider, REST provider, API mode, client mode |
| `/demo-table` | Headless hook approach with `mode: "api"` |
| `/demo-table-v2` | Compound composition with `mode: "provider"` |
| `/products` | Full example: `mode: "server"` with mock backend, advanced filters (FilterBar + sheet), card/table views, bulk actions, RBAC-gated delete |
