# Architecture Guide

How this project is organized and why it matters — even if you've never written code before.

## The Big Idea

Imagine a company where every department (Sales, HR, Finance) keeps its own files in its own cabinet, clearly labeled. Nobody digs through another department's drawer — they ask at the front desk.

That's how this project works. We call it **Feature-Driven Development (FDD)**.

Instead of organizing code by *what it is* (all buttons together, all forms together), we organize by *what it does* (everything for login together, everything for contacts together).

## The Three Layers

Think of the project as a building with three floors:

```
src/
├── app/          → The lobby (entry point, navigation)
├── features/     → The departments (business capabilities)
└── shared/       → The supply room (tools everyone uses)
```

### 1. App Layer — `src/app/`

**What it is:** The front door of the application.

**What it does:**
- Decides which page to show based on the URL
- Sets up things the whole app needs (themes, error handling)
- Wires features together on each page

**Real-world analogy:** A receptionist who directs visitors to the right department.

### 2. Features Layer — `src/features/`

**What it is:** Self-contained business capabilities.

**What it does:**
- Each feature is a complete "mini-app" with its own screens, logic, and data
- Features don't talk to each other directly — they go through the App layer
- Each feature has a "front desk" file (`index.ts`) that controls what's available to outsiders

**Real-world analogy:** Company departments. HR doesn't rummage through Finance's files — they request what they need through proper channels.

**Example feature:**

```
src/features/contacts/
├── components/          ← The visual parts (buttons, forms, cards)
│   ├── contacts-list.tsx
│   └── contact-card.tsx
├── hooks/               ← The logic (fetch data, handle actions)
│   └── use-contacts.ts
├── types/               ← The definitions (what a "contact" looks like)
│   └── contact.ts
├── contacts.test.tsx    ← The quality check (automated tests)
└── index.ts             ← The front desk (what's publicly available)
```

### 3. Shared Layer — `src/shared/`

**What it is:** Tools and building blocks used across 3 or more features.

**What it does:**
- Houses reusable UI components (buttons, inputs, cards)
- Provides utilities (date formatting, API calls)
- Stores app-wide configuration

**Real-world analogy:** The office supply room — pens, paper, printers. Things every department needs but nobody "owns."

```
src/shared/
├── components/
│   ├── ui/              ← Primitive UI components (shadcn: Button, Input, etc.)
│   ├── layouts/         ← Layout wrappers (Header, Sidebar)
│   └── providers/       ← App-wide settings (theme, etc.)
├── hooks/               ← Reusable logic
├── lib/                 ← Utilities, configurations, and libraries
│   ├── dal/             ← Data Access Layer (see docs/data-access-layer.md)
│   └── data-table/      ← DataTable system (see docs/data-table.md)
├── stores/              ← App-wide state management
├── types/               ← Shared data definitions
└── test/                ← Test configuration
```

## The Rules (and Why They Exist)

### Rule 1: Features Never Import from Other Features

```
❌ The contacts feature reaches into the auth feature's folder
✅ The contacts feature asks the app layer, which connects them
```

**Why:** If features depend on each other directly, changing one breaks the other. Keeping them independent means you can modify, replace, or remove a feature without a ripple effect.

### Rule 2: The Front Desk Rule (Public API)

Every feature has an `index.ts` file — its "front desk." Other parts of the app can only access what's listed there.

```
index.ts says:
  "You can use our ContactsPage and our useContacts hook."

index.ts does NOT say:
  "Help yourself to our internal helper functions."
```

**Why:** Just like departments don't share internal memos with the whole company, features don't expose their internal workings. This means you can reorganize a feature's internals without breaking anything else.

### Rule 3: The Rule of Three

A piece of code only moves to `shared/` when **3 or more features** use it.

| Used by | Where it lives |
|---------|---------------|
| 1 feature | Inside that feature's folder |
| 2 features | Still in the original feature (or duplicated if they'll evolve differently) |
| 3+ features | Move to `src/shared/` |

**Why:** Moving things too early creates a cluttered shared folder. Wait until there's a proven need.

### Rule 4: Keep Things Together

Tests, stories, and styles live next to the code they belong to — not in a separate folder across the project.

```
✅ contacts/
   ├── contacts-list.tsx          ← the component
   ├── contacts-list.stories.tsx  ← its visual documentation
   └── contacts-list.test.tsx     ← its tests

❌ components/contacts-list.tsx
   tests/contacts-list.test.tsx   ← too far away!
   stories/contacts-list.stories.tsx
```

**Why:** When everything related to a piece of code is right next to it, you spend less time searching and more time building.

### Rule 5: Maximum 3 Levels Deep

Folders should never nest more than 3 levels inside a feature.

```
❌ features/dashboard/analytics/reports/charts/bar-chart.tsx  (too deep)
✅ features/dashboard/components/analytics-chart.tsx          (just right)
```

**Why:** Deep nesting makes files hard to find and paths painfully long. If a feature grows that complex, it should be split into separate features.

## How Pages Work (Composition Root)

The route files in `src/app/routes/` serve as the **orchestration layer** — the place where features come together on a page.

```
Feature A ← Route File → Feature B
              (wires them together)
```

A route file:
- Imports what it needs from different features
- Passes data between them via props or callbacks
- Contains **no business logic** itself — it's just the connector

**Real-world analogy:** A meeting organizer who brings people from different departments together, sets the agenda, but doesn't do the actual work.

## Path Shortcuts (Aliases)

Instead of writing long relative paths like `../../../shared/components/ui/button`, we use shortcuts:

| Shortcut | Points to |
|----------|-----------|
| `@/` | `src/` |
| `@shared/` | `src/shared/` |
| `@features/` | `src/features/` |
| `@app/` | `src/app/` |

## Adding a New Feature — Step by Step

1. **Create the folder:** `src/features/my-feature/`
2. **Add subfolders:** `components/`, `hooks/`, `types/` (as needed)
3. **Create `index.ts`:** List only what other parts of the app should access
4. **Create a route:** Add `src/app/routes/my-feature.tsx` to connect it to a URL
5. **Use relative imports** inside the feature, aliases for everything else

## Talking to the backend

Every API call in a feature flows through the **Data Access Layer** ([docs/data-access-layer.md](./data-access-layer.md)). Each feature defines its own endpoint descriptors, Zod schemas, and a Query Options Factory under `api/` and `schemas/`; hooks come from `@shared/lib/dal` (`useQuery` on the factory, `useApiMutation` for writes, `applyApiErrorToForm` for server validation errors). NestJS error shapes are handled by default; one line at bootstrap swaps the parser for any other backend. See [src/features/products/](../src/features/products/) for a working reference.

## Authentication

Auth is [better-auth](https://www.better-auth.com/) — email/password plus optional Google, httpOnly-cookie sessions. Feature code imports `useSession`, `signIn`, `signUp`, `signOut` from `@shared/lib/auth/client`; route guards use `safeGetSession()` so the app stays usable when the backend is down. Auth failures route through the DAL's `ApiError` / `applyApiErrorToForm` path so forms and toasts behave identically to any other request. Full conventions and code patterns: [docs/authentication.md](./authentication.md).

## Naming Conventions

Two kinds of naming to be aware of — **files and folders**, and **values inside code**.

### Files and folders

| Type | Convention | Example |
|------|-----------|---------|
| Files with React components (`.tsx`) | PascalCase | `DemoTablePage.tsx`, `DataTable.tsx` |
| Hook files | camelCase | `useDataTable.ts`, `useUserProfile.ts` |
| Type files (`.types.ts` suffix) | kebab-case | `demo-table.types.ts` |
| Schema files (`.schema.ts` suffix) | kebab-case | `user.schema.ts`, `auth.schema.ts` |
| All folders | kebab-case | `data-table/`, `products/` |
| Utilities / API / other | kebab-case | `fetch-users.ts`, `utils.ts` |

### Values and constants

The rule: **`UPPER_CASE` is reserved for bare primitive magic values**. Everything else — including objects, namespaces, configs, and instances — is **`camelCase`**. Classes, types, interfaces, and React components are **`PascalCase`**.

| Role | Convention | Examples |
|------|-----------|----------|
| Bare primitive magic value (number, string, regex) | `SCREAMING_SNAKE_CASE` | `MAX_RETRIES = 3`, `AUTH_TOKEN_KEY = "auth_token"`, `FIELD_MESSAGE_PATTERN = /^.../` |
| Object, namespace, config, instance | `camelCase` | `apiClient`, `queryClient`, `config`, `userEndpoints`, `userQueries` |
| Class, type, interface, React component | `PascalCase` | `ApiError`, `UserSchema`, `ProductListingPage` |

**Heuristic:** *"Would the team ever want to add more keys to this later?"*

- Yes → it's a namespace / config. Use `camelCase`.
- No, it's a fixed primitive → use `UPPER_CASE`.

**Common confusion — `const` does not imply `UPPER_CASE`.** In modern TypeScript nearly every top-level declaration is `const`; that keyword is the default, not the signal. `UPPER_CASE` signals **role** (this is a magic primitive value), not declaration kind. All `UPPER_CASE` names are `const`, but the vast majority of `const` names are **not** `UPPER_CASE`.

Wrong vs. right:

```ts
// ❌ Shouting at reader — these are namespaces, not primitives
const USER_ENDPOINTS = { list: {...}, create: {...} };
const API_CLIENT = axios.create({...});
const USER_QUERIES = { list: (...) => ..., detail: (...) => ... };

// ✅ Signal preserved for actual magic values
const userEndpoints = { list: {...}, create: {...} };
const apiClient = axios.create({...});
const userQueries = { list: (...) => ..., detail: (...) => ... };

const MAX_RETRIES = 3;
const DEFAULT_PAGE_SIZE = 10;
const FIELD_MESSAGE_PATTERN = /^([a-zA-Z_][\w.]*)\s+(.+)$/;
```

## Quick Decision Guide

| Question | Answer |
|----------|--------|
| Where does a new component go? | Inside its feature folder |
| When does something move to shared? | When 3+ features use it |
| How do features communicate? | Through the route file (App layer) |
| How deep can folders nest? | Maximum 3 levels |
| What naming convention? | See [Naming Conventions](#naming-conventions) |
| Where do tests go? | Next to the code they test |
