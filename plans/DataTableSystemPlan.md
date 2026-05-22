# DataTable System — Architecture & Implementation Reference

> Comprehensive reference for the universal, modular DataTable system.
> Use this document across laptops and conversations for full context.

---

## Table of Contents

1. [Vision](#vision)
2. [Architecture Overview](#architecture-overview)
3. [DataProvider System](#dataprovider-system)
4. [Compound Composition Pattern](#compound-composition-pattern)
5. [Modular Feature System](#modular-feature-system)
6. [Consumer Integration Examples](#consumer-integration-examples)
7. [File Structure](#file-structure)
8. [Implementation Steps](#implementation-steps)
9. [Design Decisions & Trade-offs](#design-decisions--trade-offs)
10. [Verification Plan](#verification-plan)

---

## Vision

Transform the DataTable from a config-driven monolith into a **library-grade, modular system** where:

- **Any API works** — REST, GraphQL, cursor pagination, custom protocols
- **Every feature is a module** — search, filters, pagination, sorting, export, selection, bulk actions, view toggle
- **Modules are composed in JSX** — not config objects. Include = enabled, remove = disabled
- **Any module can be replaced** — swap the built-in pagination for infinite scroll, swap search for a command palette
- **Backwards compatible** — existing `mode: "api"` configs continue working unchanged

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Consumer Layer (JSX)                      │
│                                                              │
│  <DataTable.Root config={...}>                               │
│    <DataTable.Toolbar>                                       │
│      <DataTable.Search />   ← include = enabled              │
│      <DataTable.Filter />   ← remove = disabled              │
│    </DataTable.Toolbar>                                      │
│    <DataTable.Content />                                     │
│    <DataTable.Pagination />                                  │
│  </DataTable.Root>                                           │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                  Compound Composition Layer                    │
│                                                              │
│  DataTable.Root → calls useDataTable() → provides context    │
│  Feature components → consume context via useDataTableContext │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                  Core Hook Layer                              │
│                                                              │
│  useDataTable(config) → resolves data source → TanStack Table│
│    ├── mode: "client"    → data[] directly                   │
│    ├── mode: "server"    → custom queryFn                    │
│    ├── mode: "api"       → resolveDataSource() (REST sugar)  │
│    └── mode: "provider"  → DataProvider.getList()            │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                  DataProvider Layer                            │
│                                                              │
│  DataProvider interface → getList(params) → response         │
│    ├── createRestProvider()     (fetch-based, zero deps)     │
│    ├── createAxiosProvider()    (wraps Axios instance)       │
│    ├── createGraphQLProvider()  (per-resource queries)       │
│    └── custom: { getList() }   (any protocol)               │
│                                                              │
│  Middleware chain: logging → retry → errorNormalizer → provider│
└──────────────────────────────────────────────────────────────┘
```

---

## DataProvider System

### Core Interface

```typescript
interface DataProvider {
  getList<TData>(params: GetListParams): Promise<GetListResponse<TData>>;
}

interface GetListParams {
  resource: string;
  pagination: PaginationRequest;
  sort: SortField[];
  filters: FilterField[];
  search?: string;
  meta?: Record<string, unknown>;  // escape hatch for provider-specific data
  signal?: AbortSignal;
}
```

### Pagination — 3 Styles via Discriminated Union

```typescript
type PaginationRequest =
  | { type: "offset"; offset: number; limit: number }
  | { type: "page"; page: number; pageSize: number }
  | { type: "cursor"; cursor: string | null; limit: number };
```

### Sort & Filters — With Operators

```typescript
interface SortField {
  field: string;
  direction: "asc" | "desc";
}

interface FilterField {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

type FilterOperator =
  | "eq" | "neq" | "gt" | "gte" | "lt" | "lte"
  | "contains" | "starts_with" | "ends_with"
  | "in" | "not_in" | "is_null" | "is_not_null";
```

### Response — Discriminated Union (offset/page vs cursor)

```typescript
type GetListResponse<TData> =
  | { data: TData[]; total: number; pagination: { type: "offset" | "page" } }
  | { data: TData[]; pagination: { type: "cursor"; nextCursor: string | null; previousCursor?: string | null }; total?: number };
```

### Error Normalization

```typescript
interface DataProviderError {
  message: string;
  statusCode?: number;
  code?: string;           // "UNAUTHORIZED", "RATE_LIMITED", etc.
  errors?: Array<{ field?: string; message: string }>;
  raw?: unknown;
}
```

### Middleware (Function Composition)

```typescript
type DataProviderMiddleware = (next: DataProvider) => DataProvider;

function applyMiddleware(middlewares: DataProviderMiddleware[], provider: DataProvider): DataProvider;

// Usage:
const provider = applyMiddleware(
  [loggingMiddleware(), retryMiddleware({ maxRetries: 2 }), errorNormalizerMiddleware()],
  createAxiosProvider(apiClient, { baseUrl: "/api/v1" }),
);
```

### Provider Registry (Context)

```typescript
// App root — set once:
<DataProviderRegistry provider={defaultProvider}>
  <Outlet />
</DataProviderRegistry>

// Resolution chain:
// 1. Table config provider  →  2. Global registry  →  3. Built-in fetch (no auth)
```

### Built-in Providers

| Provider | Factory | Transport | Dependencies |
|----------|---------|-----------|--------------|
| REST | `createRestProvider(opts)` | `globalThis.fetch` | None (zero deps) |
| Axios | `createAxiosProvider(client, opts)` | Axios instance | Axios (opt-in) |
| GraphQL | `createGraphQLProvider(opts)` | `globalThis.fetch` | None |
| Legacy Bridge | `createLegacyBridge(adapter, mapping)` | Old `DataTableAdapter` | Existing code |

### REST Provider Configuration

```typescript
createRestProvider({
  baseUrl: "/api/v1",
  headers: () => ({ Authorization: `Bearer ${getToken()}` }),
  pagination: { style: "offset", skipParam: "skip", limitParam: "limit" },
  sort:
    | { style: "flat", sortByParam: "sortBy", orderParam: "order" }
    | { style: "repeated", param: "sort" }           // ?sort=name:asc&sort=age:desc
    | { style: "json", param: "sort" }                // ?sort=[{"field":"name","dir":"asc"}]
    | { style: "custom", serialize: (sort) => ({}) }, // full control
  filter:
    | { style: "flat", paramMap: { status: "status" } } // ?status=active
    | { style: "brackets" }                              // ?filter[status][eq]=active
    | { style: "json", param: "filters" }                // ?filters=JSON
    | { style: "custom", serialize: (filters) => ({}) }, // full control
  response: { dataPath: "data", totalPath: "total" },
});
```

### Data Source Modes (updated)

| Mode | When to use | Developer writes |
|------|------------|-----------------|
| `"client"` | Static/preloaded data | Pass `data[]` directly |
| `"server"` | Non-standard APIs, complex transforms | A `queryFn` function |
| `"api"` | Simple REST (convenience sugar) | Just config — zero fetch code |
| `"provider"` | **Universal** — any API, any protocol | One-time provider setup, then just `resource` |

---

## Compound Composition Pattern

### Philosophy

- **Data/behavior** lives in config (passed to `DataTable.Root`)
- **UI/layout** lives in JSX (composed as children)
- **Features exist because their component is in the tree** — no `enabled` flags needed

### Core Pattern

```tsx
<DataTable.Root columns={columns} dataSource={dataSource}>
  {/* Include = enabled. Remove = disabled. Reorder = change layout. */}
  <DataTable.Toolbar>
    <DataTable.Search placeholder="Search..." />
    <DataTable.Filter column="status" options={statusOptions} />
    <DataTable.ViewToggle />
    <DataTable.Export filename="data" />
  </DataTable.Toolbar>

  <DataTable.Content />

  <DataTable.Pagination showPageSize showRowCount />

  <DataTable.Selection />
  <DataTable.BulkBar>
    <Button>Export Selected</Button>
    <Button variant="destructive">Delete</Button>
  </DataTable.BulkBar>
</DataTable.Root>
```

### How It Works Internally

```
DataTable.Root
  │  calls useDataTable(config)
  │  provides DataTableContext
  │
  ├── DataTable.Toolbar     ← reads context, renders children
  │   ├── DataTable.Search  ← reads globalFilter/setGlobalFilter from context
  │   ├── DataTable.Filter  ← reads table.getColumn() from context
  │   └── DataTable.Export  ← reads table data from context
  │
  ├── DataTable.Content     ← reads table, isLoading, isEmpty, view from context
  │   ├── renders Skeleton if loading
  │   ├── renders Empty if empty
  │   ├── renders Table view or Card grid based on view state
  │   └── OR accepts render prop: {(ctx) => <Custom />}
  │
  ├── DataTable.Pagination  ← reads table from context
  │
  └── DataTable.BulkBar     ← reads selected rows from context
```

### Context Type

```typescript
interface DataTableContext<TData> {
  table: Table<TData>;
  isLoading: boolean;
  isFetching: boolean;
  isEmpty: boolean;
  data: TData[];
  totalRows: number;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  view: DataTableView;
  setView: (view: DataTableView) => void;
  availableViews: DataTableView[];
  config: DataTableConfig<TData>;
}
```

### Three Levels of Customization

| Level | How | Example |
|-------|-----|---------|
| **Configure** | Props on built-in components | `<DataTable.Pagination showPageSize={false} />` |
| **Compose** | Arrange/omit components in JSX | Remove `<DataTable.Search />` = no search |
| **Replace** | Your own component + `useDataTableContext()` | `<MyCustomPagination />` reading from context |

### Replacing a Feature

```tsx
// Your custom component — uses same context, different UI
function MyInfiniteScroll() {
  const { table, isFetching } = useDataTableContext();
  // ... your infinite scroll logic using table.nextPage(), etc.
  return <div>...</div>;
}

// Just swap in JSX:
<DataTable.Root config={config}>
  <DataTable.Content />
  <MyInfiniteScroll />  {/* instead of <DataTable.Pagination /> */}
</DataTable.Root>
```

### Runtime Feature Flags

```tsx
<DataTable.Root config={config}>
  <DataTable.Toolbar>
    <DataTable.Search />
    {featureFlags.advancedFilters && <DataTable.Filter column="status" />}
    {featureFlags.exportEnabled && <DataTable.Export />}
  </DataTable.Toolbar>
  <DataTable.Content />
  <DataTable.Pagination />
</DataTable.Root>
```

### Three Levels of Usage

| Level | Pattern | When to use |
|-------|---------|-------------|
| **Composed** | `<DataTable.Root>` + compound children | 90% of cases |
| **Mixed** | Compound root + render prop on `<DataTable.Content>` | Custom loading/empty |
| **Headless** | `useDataTable(config)` directly | Fully custom UI |

---

## Modular Hook System (`modules/`)

### Philosophy

`useDataTable` was a 259-line monolith. It is now a **thin orchestrator** (~50 lines) that composes 5 focused hooks, each owning a single concern. The compound UI components (`DT.*`) remain unchanged — they consume the same `UseDataTableReturn` contract.

### Module Structure

```
src/shared/lib/data-table/modules/
├── index.ts                  # barrel export
├── useViewState.ts           # ~25 lines — available views + view toggle
├── useDataSource.ts          # ~40 lines — provider/api/server/client resolution + cursor map
├── useTableState.ts          # ~70 lines — pagination, sorting, filters, search (URL or local)
├── useServerData.ts          # ~40 lines — query execution + loading/pagination flags
└── useTableInstance.ts       # ~60 lines — column visibility, row selection, useReactTable wiring
```

### Composition Flow

```
useDataTable(config)                    ← thin orchestrator (~50 lines)
  │
  ├── useViewState(...)                 ← view, setView, availableViews
  │
  ├── useDataSource(...)                ← resolves raw config → { mode, queryKey, queryFn, data }
  │
  ├── useTableState(...)                ← pagination, sorting, filters, search (URL or local)
  │
  ├── useServerData(...)                ← executes query (or returns client data), derives flags
  │
  └── useTableInstance(...)             ← column visibility, row selection, useReactTable()
        │
        └── returns Table<TData>
```

### Module Details

| Module | State Owned | Dependencies | Key Design Note |
|--------|-------------|--------------|-----------------|
| `useViewState` | `view` (useState), `availableViews` (useMemo) | None | Simplest module, zero cross-deps |
| `useDataSource` | `cursorMapRef` (useRef) | `useDataTableAdapter()`, `useDataProvider()`, `resolveDataSource`, `resolveProviderDataSource` | Owns cursor map because it's tied to provider resolution |
| `useTableState` | pagination, sorting, filters, search (useState × 4) | `useDataTableSearchParams` | Encapsulates `syncWithUrl` entirely — no other module knows about it. Page-reset-on-change is trivial because setters share scope |
| `useServerData` | None (delegates to `useDataTableQuery`) | `useDataTableQuery` | Client mode returns static values. Owns `noopQueryFn` |
| `useTableInstance` | `columnVisibility` (useState), `rowSelection` (useState) | `@tanstack/react-table` | Receives everything via params, calls `useReactTable` |

### Why 5 Modules (Not 9 Per-Feature)

Splitting into per-feature hooks (usePagination, useSorting, useFilter, useSearch) would create **circular dependencies** for the page-reset-on-change behavior: sorting/filter/search changes must reset pagination to page 0. Additionally, `useDataTableSearchParams` returns all 4 state values as a bundle — it can't be split across hooks. One `useTableState` module keeps this logic clean.

### What Does NOT Move Into `modules/`

| File | Reason |
|------|--------|
| `useDataTableQuery.ts` | General React Query wrapper, consumed by `useServerData` |
| `useDataTableSearchParams.ts` | TanStack Router integration, consumed by `useTableState` |
| `resolveDataSource.ts` | Pure function, consumed by `useDataSource` |
| `provider/resolveProviderDataSource.ts` | Pure function, consumed by `useDataSource` |
| `export-csv.ts` | Standalone utility, not part of useDataTable |
| `selection-column.tsx` | Standalone factory, not part of useDataTable |

---

## Router Adapter System

### Problem

The library's URL sync (`syncWithUrl: true`) was hard-coupled to TanStack Router via `useDataTableSearchParams.ts`. This prevented use with Next.js, React Router, or any other framework.

### Solution

A pluggable `RouterAdapter` interface that abstracts URL read/write operations. The adapter is framework-specific (~15 lines per framework); all serialization logic stays in the library.

### Adapter Interface

```typescript
interface RouterAdapter {
  useSearchParams: () => RouterSearchParamsReturn;
}

interface RouterSearchParamsReturn {
  /** Current URL search params as flat key-value map */
  getParams: () => Record<string, unknown>;
  /** Merge updates into URL params. undefined = remove key. Replaces history entry. */
  setParams: (updates: Record<string, unknown>) => void;
}
```

The adapter doesn't know about pagination, sorting, or filters. It only moves flat key-value pairs to/from the URL. Serialization (`"name.asc"`, JSON filters) is handled by `router/serialization.ts`.

### How It Works

```
useDataTable(config)
  → useTableState({ syncWithUrl: true })
    → useRouterAdapter()           ← reads adapter from context
    → useUrlSyncedState(adapter)   ← generic URL sync (no router imports)
      → adapter.useSearchParams()  ← framework-specific read/write
      → serialization.ts           ← parse/serialize sort, filters
```

When `syncWithUrl: false` or no adapter provided: falls back to local React state. Dev warning if `syncWithUrl: true` but no adapter.

### Noop Adapter (Hooks Rules)

React hooks must be called unconditionally. When URL sync is off, a noop adapter is used:

```typescript
const noopAdapter: RouterAdapter = {
  useSearchParams: () => ({
    getParams: () => ({}),
    setParams: () => {},
  }),
};
```

### Built-in: TanStack Router Adapter

```typescript
export function createTanStackRouterAdapter(): RouterAdapter {
  return {
    useSearchParams() {
      const search = useSearch({ strict: false }) as Record<string, unknown>;
      const navigate = useNavigate();
      return {
        getParams: () => search,
        setParams: (updates) => {
          void navigate({
            search: ((prev) => ({ ...prev, ...updates })) as never,
            replace: true,
          });
        },
      };
    },
  };
}
```

### Example: Next.js Adapter

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

### App Wiring

```tsx
// __root.tsx
import { createTanStackRouterAdapter, RouterAdapterProvider } from "@shared/lib/data-table";

const routerAdapter = createTanStackRouterAdapter();

function RootComponent() {
  return (
    <RouterAdapterProvider adapter={routerAdapter}>
      <DataProviderRegistry provider={dataProvider}>
        {/* ... */}
      </DataProviderRegistry>
    </RouterAdapterProvider>
  );
}
```

### URL Parameter Format (unchanged)

| Param | Format | Example |
|-------|--------|---------|
| `page` | number (0-indexed) | `?page=2` |
| `pageSize` | number | `?pageSize=20` |
| `sort` | `"id.asc"` or `"id.desc"` | `?sort=name.asc` |
| `filters` | JSON string | `?filters=[{"id":"status","value":"active"}]` |
| `search` | string | `?search=john` |

Prefix support: `?users_page=1&orders_page=2` for multi-table pages.

---

## Consumer Integration Examples

### Example 1: mode:"api" — unchanged, backwards compatible

```typescript
// Current code — works exactly as before
const usersTableConfig: DataTableConfig<User> = {
  columns,
  dataSource: {
    mode: "api",
    resource: "https://dummyjson.com/users/search",
    pagination: { style: "offset", skipParam: "skip", limitParam: "limit" },
    sort: { style: "flat", sortByParam: "sortBy", orderParam: "order" },
    searchParam: "q",
    response: { dataPath: "users", totalPath: "total" },
  },
};
```

### Example 2: mode:"provider" — global Axios provider

```typescript
// App root (once):
const provider = applyMiddleware(
  [loggingMiddleware()],
  createAxiosProvider(apiClient, {
    baseUrl: "/api/v1",
    pagination: { style: "offset" },
    response: { dataPath: "data", totalPath: "total" },
  }),
);

<DataProviderRegistry provider={provider}>
  <Outlet />
</DataProviderRegistry>

// Table config (minimal):
const usersTableConfig: DataTableConfig<User> = {
  columns,
  dataSource: {
    mode: "provider",
    resource: "/users",  // provider handles everything else
  },
};
```

### Example 3: Per-table provider override

```typescript
const analyticsProvider = createRestProvider({
  baseUrl: "https://analytics.internal/v2",
  headers: () => ({ Authorization: `Bearer ${getAnalyticsToken()}` }),
  pagination: { style: "page" },
  response: { dataPath: "results", totalPath: "meta.count" },
});

const eventsConfig: DataTableConfig<Event> = {
  columns: eventColumns,
  dataSource: {
    mode: "provider",
    resource: "/events",
    provider: analyticsProvider,  // overrides global
  },
};
```

### Example 4: Cursor-based pagination

```typescript
const messagesConfig: DataTableConfig<Message> = {
  columns: messageColumns,
  dataSource: {
    mode: "provider",
    resource: "/messages",
    paginationType: "cursor",
  },
};
// Pagination UI auto-switches to prev/next only
```

### Example 5: GraphQL provider

```typescript
const graphqlProvider = createGraphQLProvider({
  endpoint: "https://api.example.com/graphql",
  headers: () => ({ Authorization: `Bearer ${getToken()}` }),
  resources: {
    "/products": {
      query: `
        query Products($first: Int, $after: String, $sortBy: ProductSortKey) {
          products(first: $first, after: $after, sortKey: $sortBy) {
            edges { node { id title price } }
            pageInfo { hasNextPage endCursor }
            totalCount
          }
        }
      `,
      variables: (params) => ({
        first: params.pagination.type === "cursor" ? params.pagination.limit : 10,
        after: params.pagination.type === "cursor" ? params.pagination.cursor : null,
        sortBy: params.sort[0]?.field.toUpperCase() ?? "TITLE",
      }),
      transformResponse: (data) => ({
        data: data.products.edges.map((e) => e.node),
        pagination: { type: "cursor", nextCursor: data.products.pageInfo.endCursor },
        total: data.products.totalCount,
      }),
    },
  },
});

const productsConfig: DataTableConfig<Product> = {
  columns: productColumns,
  dataSource: {
    mode: "provider",
    resource: "/products",
    provider: graphqlProvider,
    paginationType: "cursor",
  },
};
```

### Example 6: Custom provider (any protocol)

```typescript
const customProvider: DataProvider = {
  async getList(params) {
    const result = await someInternalSDK.query({
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

### Example 7: Compound composition — full page

```tsx
function UsersPage() {
  return (
    <DataTable.Root columns={userColumns} dataSource={usersDataSource}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex gap-2">
          <DataTable.ViewToggle />
          <DataTable.Export filename="users" />
        </div>
      </div>

      <DataTable.Toolbar>
        <DataTable.Search placeholder="Search users..." />
        <DataTable.Filter column="gender" title="Gender" options={genderOptions} />
        <DataTable.Filter column="status" title="Status" options={statusOptions} />
      </DataTable.Toolbar>

      <DataTable.Content />

      <DataTable.Pagination showPageSize showRowCount />

      <DataTable.BulkBar>
        <Button onClick={handleExport}>Export Selected</Button>
        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
      </DataTable.BulkBar>
    </DataTable.Root>
  );
}
```

### Example 8: Minimal table — just data, no features

```tsx
function SimpleTable() {
  return (
    <DataTable.Root columns={columns} dataSource={{ mode: "client", data: items }}>
      <DataTable.Content />
    </DataTable.Root>
  );
}
```

---

## File Structure

Everything lives in `src/shared/lib/data-table/` — a fully self-contained library.

```
src/shared/lib/data-table/
├── index.ts                    # single barrel export for consumers
│
├── components/                 # UI components (each has prop-based + compound wrapper)
│   ├── index.ts                #   barrel + DT namespace definition
│   ├── DataTable.tsx           #   core table renderer
│   ├── DataTableSearch.tsx     #   debounced search input
│   ├── DataTablePagination.tsx #   page numbers + page size
│   ├── DataTableColumnHeader.tsx # sortable column header
│   ├── DataTableFacetedFilter.tsx # multi-select filter
│   ├── DataTableSingleFilter.tsx  # single-select filter
│   ├── DataTableRangeFilter.tsx   # min/max range filter
│   ├── DataTableAdvancedFilter.tsx # sheet-based filter panel
│   ├── DataTableFilterTags.tsx    # active filter chips
│   ├── DataTableViewToggle.tsx    # table/card view switch
│   ├── DataTableViewOptions.tsx   # column visibility dropdown
│   ├── DataTableBulkBar.tsx       # floating bulk action bar
│   ├── DataTableRowActions.tsx    # per-row action dropdown
│   ├── DataTableCardGrid.tsx      # card grid layout
│   ├── DataTableToolbar.tsx       # toolbar (auto + manual)
│   ├── DataTableEmpty.tsx         # empty state
│   ├── DataTableSkeleton.tsx      # loading skeleton
│   ├── DataTableContext.tsx       # 4 React contexts for perf
│   ├── DataTableRoot.tsx          # root provider component
│   ├── DataTableContent.tsx       # smart content renderer
│   └── selection-column.tsx       # checkbox column factory
│
├── modules/                    # hook decomposition (useDataTable internals)
│   ├── index.ts
│   ├── useDataTable.ts         #   main hook (thin orchestrator)
│   ├── useDataTableQuery.ts    #   React Query wrapper
│   ├── useViewState.ts         #   view toggle state
│   ├── useDataSource.ts        #   data source resolution
│   ├── useTableState.ts        #   pagination/sort/filter/search state
│   ├── useServerData.ts        #   server query + loading flags
│   └── useTableInstance.ts     #   TanStack Table wiring
│
├── core/                       # provider framework + legacy adapters
│   ├── index.ts
│   ├── DataProviderRegistry.tsx #  global provider context
│   ├── DataTableProvider.tsx    #  legacy adapter context
│   ├── data-provider.types.ts   #  DataProvider interface
│   ├── data-provider-error.ts   #  error normalization
│   ├── data-provider-middleware.ts # middleware composition
│   ├── createRestAdapter.ts     #  legacy REST adapter factory
│   ├── resolveDataSource.ts     #  mode:"api" resolver
│   ├── resolveProviderDataSource.ts # mode:"provider" resolver
│   └── utils.ts                 #  path/header helpers
│
├── providers/                  # built-in provider implementations
│   ├── index.ts
│   ├── rest-provider.ts        #   fetch-based REST
│   ├── axios-provider.ts       #   Axios wrapper
│   ├── graphql-provider.ts     #   GraphQL
│   └── legacy-adapter-bridge.ts #  backwards compat bridge
│
├── middleware/                  # built-in middleware
│   ├── index.ts
│   ├── logging.ts
│   ├── error-normalizer.ts
│   ├── retry.ts
│   └── validation.ts
│
├── router/                     # framework-agnostic URL sync
│   ├── index.ts
│   ├── router-adapter.types.ts #   RouterAdapter interface
│   ├── RouterAdapterProvider.tsx #  context for adapter
│   ├── tanstack-router-adapter.ts # TanStack Router impl
│   ├── useUrlSyncedState.ts    #   generic URL-synced state
│   ├── useDataTableSearchParams.ts # deprecated compat wrapper
│   └── serialization.ts        #   sort/filter URL encoding
│
├── types/
│   └── data-table.types.ts     # central type definitions
│
├── schemas/
│   └── data-table.schema.ts    # Zod validation schemas
│
└── utils/
    └── export-csv.ts           # CSV export utilities
```

---

## Implementation Steps

### Step 1: Core Provider Types

Create `src/shared/lib/data-table/provider/`:
- `data-provider.types.ts` — DataProvider, GetListParams, GetListResponse, PaginationRequest, SortField, FilterField, FilterOperator
- `data-provider-error.ts` — DataProviderError, normalizeError, isDataProviderError
- `data-provider-middleware.ts` — DataProviderMiddleware type, applyMiddleware function
- `DataProviderRegistry.tsx` — React context + DataProviderRegistry component + useDataProvider hook
- `resolveProviderDataSource.ts` — converts mode:"provider" config to a queryFn for useDataTableQuery

### Step 2: Built-in Providers

Create `src/shared/lib/data-table/providers/`:
- `rest-provider.ts` — createRestProvider using globalThis.fetch (zero deps), with configurable pagination/sort/filter/response mapping
- `axios-provider.ts` — createAxiosProvider wrapping an Axios instance, delegates to rest-provider internals
- `graphql-provider.ts` — createGraphQLProvider with per-resource query/variables/transform config
- `legacy-adapter-bridge.ts` — wraps old DataTableAdapter interface into DataProvider for migration

### Step 3: Built-in Middleware

Create `src/shared/lib/data-table/middleware/`:
- `logging.ts` — logs resource, timing, row count to console.debug
- `error-normalizer.ts` — catches errors, wraps in DataProviderError
- `retry.ts` — configurable retry with exponential backoff (maxRetries, delay, retryOn)
- `validation.ts` — optional Zod schema validation of response rows

### Step 4: Update Existing Types

Modify `src/shared/lib/data-table/data-table.types.ts`:
- Add `ProviderDataSource<TData>` to the `DataSource` union
- Add `FilterOperator` type (reuse from provider types)
- All existing types remain unchanged

### Step 5: Update Core Hook

Modify `src/shared/lib/data-table/useDataTable.ts`:
- Add `mode: "provider"` branch in data source resolution
- Add cursor pagination state management (Map<pageIndex, cursor>)
- Add `hasNextPage`/`hasPreviousPage` to return type for cursor mode
- Keep existing mode:"api"/"server"/"client" branches unchanged

Modify `src/shared/lib/data-table/useDataTableQuery.ts`:
- Handle GetListResponse cursor variant
- Extract cursor from response and update cursor map

### Step 6: Compound Composition Layer

Create `src/shared/components/ui/DataTable/compound/`:
- `DataTableContext.tsx` — context type (extends UseDataTableReturn with config), createContext, DataTableContextProvider, useDataTableContext hook
- `DataTableRoot.tsx` — accepts config props, calls useDataTable, wraps children in context provider
- `DataTableContent.tsx` — reads context, auto-renders skeleton/empty/table/card-grid based on state. Accepts optional render prop for custom rendering.
- `DataTableCompoundToolbar.tsx` — reads context, renders children in a flex layout with reset button

Create namespace export in `src/shared/components/ui/DataTable/index.ts`:
```typescript
export const DataTable = {
  Root: DataTableRoot,
  Content: DataTableContent,
  Toolbar: DataTableCompoundToolbar,
  Search: DataTableSearch,        // existing, reads from context when available
  Filter: DataTableFacetedFilter, // existing, reads from context when available
  Pagination: DataTablePagination,
  BulkBar: DataTableBulkBar,
  ViewToggle: DataTableViewToggle,
  Export: DataTableExport,         // new thin wrapper
  Selection: ...,                  // checkbox column helper
};
```

### Step 7: Modular Hook Extraction

Extract `useDataTable.ts` (259 lines) into 5 focused hooks in `src/shared/lib/data-table/modules/`:

1. `useViewState.ts` — view toggle state (from lines 43-51)
2. `useDataSource.ts` — data source resolution + cursor map (from lines 54-84)
3. `useTableState.ts` — pagination, sorting, filters, search with URL/local dual mode (from lines 88-129)
4. `useServerData.ts` — query execution + loading/pagination flags (from lines 147-170)
5. `useTableInstance.ts` — column visibility, row selection, useReactTable wiring (from lines 133-223)

Rewrite `useDataTable.ts` as a ~50-line thin orchestrator composing these hooks. `UseDataTableReturn` type remains unchanged — zero breaking changes for compound components.

See [Modular Hook System](#modular-hook-system-modules) section for full details.

### Step 8: Router Adapter Abstraction

Make URL sync framework-agnostic by abstracting the TanStack Router dependency behind a pluggable adapter.

Create `src/shared/lib/data-table/router/`:
- `router-adapter.types.ts` — `RouterAdapter` interface: `{ useSearchParams(): { getParams, setParams } }`
- `RouterAdapterProvider.tsx` — React context + `useRouterAdapter()` hook
- `serialization.ts` — Extract `parseSortParam`, `serializeSortState`, `parseFiltersParam`, `serializeFiltersState` from `useDataTableSearchParams.ts`
- `useUrlSyncedState.ts` — Same logic as `useDataTableSearchParams` but consumes any `RouterAdapter` instead of TanStack Router directly
- `tanstack-router-adapter.ts` — TanStack Router adapter using `useSearch` + `useNavigate`

Update `modules/useTableState.ts`:
- Read adapter from `useRouterAdapter()` context
- Replace `useDataTableSearchParams` with `useUrlSyncedState(adapter ?? noopAdapter)`
- Dev warning when `syncWithUrl: true` but no adapter provided

Rewrite `useDataTableSearchParams.ts`:
- Delegate to `useUrlSyncedState` + TanStack adapter internally (backwards compat)

Wire `RouterAdapterProvider` in `__root.tsx`.

See [Router Adapter System](#router-adapter-system) section for full details.

### Step 9: Wire into App

- Add `DataProviderRegistry` to `src/app/routes/__root.tsx` alongside existing `DataTableProvider`
- Create new demo page using compound composition pattern at `/demo-table-v2`
- Keep existing `/demo-table` working unchanged

### Step 10: Barrel Exports & Verification

- Update all `index.ts` barrel files
- Run `npm run type-check`
- Run `npm run build`
- Run `npm run lint`
- Verify existing demo at `/demo-table` still works
- Verify new compound demo at `/demo-table-v2`

---

## Design Decisions & Trade-offs

### 1. getList only, no CRUD

Row actions already have `onClick` handlers. Adding create/update/delete to DataProvider would turn this into a Refine clone. Keep scope focused on table data fetching.

### 2. mode:"api" stays forever

It's the "zero-code" convenience for simple REST APIs. mode:"provider" is the "full-control" option. No breaking changes to existing code.

### 3. Middleware is function composition

No event emitters, no registry. Just `(next: DataProvider) => DataProvider`. Simple, type-safe, tree-shakeable.

### 4. REST provider uses globalThis.fetch

Zero vendor dependencies in core. Axios is opt-in via separate file.

### 5. Cursor pagination uses pageIndex → cursor map

Keeps TanStack Table's pageIndex-based model intact. Pagination UI auto-detects and renders prev/next only.

### 6. Compound components are thin wrappers

`DataTable.Pagination` internally renders `<DataTablePagination table={ctx.table} />`. No new logic — just context wiring. All existing prop-based components continue working independently.

### 7. Features as JSX = feature flags

Including `<DataTable.Search />` enables search. Removing it disables it. `{flag && <DataTable.Export />}` is a runtime feature flag. No special system needed — React conditional rendering IS the feature flag.

### 8. Three escape hatches

1. **Compound** — use `<DataTable.Root>` + children (90% of cases)
2. **Mixed** — compound root + render prop on `<DataTable.Content>` (custom states)
3. **Headless** — `useDataTable(config)` directly (fully custom UI)

### 9. Router adapter, not router dependency

URL sync is abstracted behind `RouterAdapter` — a ~15-line interface any framework can implement. The library has zero direct router imports. TanStack Router adapter is provided for this project; Next.js/React Router users write their own. Context-provided, same pattern as `DataProviderRegistry`.

---

## Verification Plan

1. **Backwards compatibility** — `/demo-table` with `mode: "api"` works identically
2. **New provider demo** — `/demo-table-v2` with `mode: "provider"` + compound composition
3. **Type safety** — `npm run type-check` passes
4. **Build** — `npm run build` succeeds
5. **Lint** — `npm run lint` passes
6. **Feature modularity** — each compound child can be added/removed without errors
7. **Provider override** — per-table provider works alongside global
8. **Context escape hatch** — `useDataTableContext()` works in custom components

---

## Research References

Architecture patterns informed by:
- **TanStack Table v8** — TableFeature interface, feature registration, state contribution
- **Refine.dev** — DataProvider contract, per-resource overrides, middleware
- **React Admin** — dataProvider abstraction, cursor pagination support
- **Lexical (Meta)** — plugins as React components, context-based communication
- **TipTap** — extension architecture, extend() for customization
- **Radix UI** — compound composition, context-based state sharing, asChild pattern
- **Zustand** — middleware as function composition
- **Feature Sliced Design** — modular feature organization
- **Kent C. Dodds** — compound components with React hooks, state reducer pattern
