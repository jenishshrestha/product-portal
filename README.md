# Product Portal Frontend

**The React + AI Stack for 2026** — A feature-driven starter for vibe coding with a consistent design system and code quality guardrails.

![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)
![Bun](https://img.shields.io/badge/bun-%3E%3D1-orange.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## What Is This?

A production-ready React starter built for AI-assisted development. It comes with a pre-configured design system (colors, typography, 56 UI components) and strict code quality guardrails — so whether you're vibe coding with Claude, Cursor, or any AI tool, the output stays consistent and clean.

Clone it, point your AI coding tool at it, and start building.

## Stack

| Category      | Tools                                                               |
| ------------- | ------------------------------------------------------------------- |
| **Core**      | React 19 &middot; Vite 8 &middot; TypeScript 5.9                    |
| **Styling**   | Tailwind CSS 4 &middot; shadcn/ui (56 components) &middot; Radix UI |
| **Routing**   | TanStack Router (file-based)                                        |
| **Data**      | TanStack Query &middot; Axios                                       |
| **State**     | Zustand                                                             |
| **Forms**     | React Hook Form &middot; Zod                                        |
| **Animation** | Motion                                                              |
| **AI**        | Vercel AI SDK                                                       |
| **Testing**   | Vitest &middot; Testing Library &middot; Playwright                 |
| **DX**        | Biome &middot; Storybook 10 &middot; Husky                          |

## Quick Start

```bash
# 1. Clone
git clone git@bitbucket.org:heubert/heubert-frontend-starter.git
cd heubert-frontend-starter

# 2. Install
bun install

# 3. Environment
cp .env.example .env

# 4. Install AI Skills
./setup-ai-skills.sh

# 5. Dev server → http://localhost:5173
bun run dev

# 6. Storybook → http://localhost:6006
bun run storybook
```

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [Bun](https://bun.sh/) >= 1

## Scripts

| Command                   | Description                    |
| ------------------------- | ------------------------------ |
| `bun run dev`             | Start dev server (port 5173)   |
| `bun run build`           | Type-check + production build  |
| `bun run preview`         | Preview production build       |
| `bun run type-check`      | TypeScript type checking       |
| `bun run lint`            | Lint with Biome                |
| `bun run format`          | Format with Biome              |
| `bun run test`            | Run unit tests (Vitest)        |
| `bun run test:ui`         | Run tests with Vitest UI       |
| `bun run test:e2e`        | Run E2E tests (Playwright)     |
| `bun run storybook`       | Start Storybook (port 6006)    |
| `bun run build-storybook` | Build Storybook for deployment |

## Documentation

| Document                                       | Description                                               |
| ---------------------------------------------- | --------------------------------------------------------- |
| [Architecture Guide](docs/architecture.md)     | How the project is organized (FDD, layers, rules)         |
| [Coding Principles](docs/coding-principles.md) | KISS, DRY, SOLID, YAGNI, Composition, Accessibility       |
| [Git Guardrails](docs/git-guardrails.md)       | Automated quality checkpoints with examples and scenarios |
| [AI Skills Guide](docs/ai-skills.md)           | How AI assistants are trained to follow project standards  |
| [DataTable System](docs/data-table.md)         | Config-driven tables — providers, composition, all features |

## Project Structure

```
src/
├── app/                  # Entry point + routing (the "lobby")
│   ├── main.tsx
│   └── routes/
├── features/             # Business capabilities (self-contained modules)
│   └── home/
└── shared/               # Tools used by 3+ features (the "supply room")
    ├── components/
    │   ├── ui/           # 56 shadcn/ui components with co-located stories
    │   └── providers/    # ThemeProvider
    ├── hooks/
    ├── lib/              # Utilities, API client, query config
    ├── stores/           # Zustand stores
    ├── types/
    └── test/
```

For a detailed explanation of each layer and the rules that govern them, see the [Architecture Guide](docs/architecture.md).

## Git Guardrails

Three automatic checkpoints protect code quality:

| Checkpoint         | Trigger      | What it checks                                                      |
| ------------------ | ------------ | ------------------------------------------------------------------- |
| **Pre-Commit**     | `git commit` | Biome lint + format on changed files                                |
| **Commit Message** | `git commit` | [Conventional Commits](https://www.conventionalcommits.org/) format |
| **Pre-Push**       | `git push`   | TypeScript type-check + production build                            |

For the full guide with examples, scenarios, and troubleshooting, see [Git Guardrails](docs/git-guardrails.md).

## AI Skills

This project includes AI agent skills for Claude Code:

```bash
./setup-ai-skills.sh          # Install all skills
./setup-ai-skills.sh --force  # Reinstall
```

**Installed skills:** `code-review` &middot; `FDD-architecture` &middot; `tailwind-v4-best-practices` &middot; `vercel-composition-patterns` &middot; `vercel-react-best-practices`

## Environment Variables

```bash
# API
VITE_API_URL=http://localhost:3000

# AI (Vercel AI SDK)
VITE_OPENAI_API_KEY=your_key_here

# Feature Flags
VITE_ENABLE_AI=true
VITE_ENABLE_ANALYTICS=false
```

## License

MIT

---

Built with [React](https://react.dev/) &middot; [Vite](https://vite.dev/) &middot; [TanStack](https://tanstack.com/) &middot; [Tailwind CSS](https://tailwindcss.com/) &middot; [shadcn/ui](https://ui.shadcn.com/) &middot; [Vercel AI SDK](https://sdk.vercel.ai/)
