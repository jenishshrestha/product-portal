# AI Skills Guide

How AI coding assistants are trained to follow our project's standards — explained for everyone.

## What Are AI Skills?

When you use an AI coding tool like Claude Code, it doesn't automatically know your project's rules. It might use the wrong folder structure, pick outdated patterns, or ignore your naming conventions.

**AI Skills** solve this. They are instruction sets that teach the AI how this specific project works — its architecture, coding style, review standards, and design system. Think of them as an employee handbook for the AI.

## Why Do We Need Them?

Without skills, every team member has to manually tell the AI:

> "We use Feature-Driven Development. Put components in CamelCase. Use Tailwind v4 tokens, not direct colors. Follow Conventional Commits..."

With skills installed, the AI **already knows all of this**. You just say what you want built, and it follows the project's standards automatically.

This is what makes "vibe coding" consistent — the AI produces code that looks like the rest of the codebase, not random boilerplate from the internet.

## The Five Skills

This project ships with five skills, divided into two categories:

### Project-Specific Skills (Custom)

These were written specifically for this project.

| Skill                          | Purpose                                                                    | When it activates                                                               |
| ------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Code Review**                | Reviews code for quality, security, and architecture violations            | When you ask for a "code review", "security check", or "refactor"               |
| **FDD Architecture**           | Enforces Feature-Driven Development folder structure and import rules      | When you organize features, create new components, or discuss project structure |
| **Tailwind v4 Best Practices** | Guides the AI to use design tokens, OKLCh colors, and Tailwind v4 patterns | When working on any CSS, styling, themes, or design system configuration        |

### Industry Best Practices (from Vercel)

These come from Vercel's open-source engineering guidelines.

| Skill                          | Purpose                                                                                      | When it activates                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **React Composition Patterns** | Teaches compound components, avoiding boolean prop explosion, and children-first composition | When refactoring complex components or building reusable APIs                      |
| **React Best Practices**       | 65 performance optimization rules across rendering, state, async, and bundling               | When writing or refactoring React components, data fetching, or performance tuning |

## How Skills Work

### Automatic Activation

You don't need to "call" a skill manually. The AI reads the skill descriptions and activates the right one based on your request:

| You say                             | Skill that activates       |
| ----------------------------------- | -------------------------- |
| "Create a new contacts feature"     | FDD Architecture           |
| "Review this pull request"          | Code Review                |
| "Style this card component"         | Tailwind v4 Best Practices |
| "This component has too many props" | React Composition Patterns |
| "Optimize the dashboard rendering"  | React Best Practices       |

### What Happens Behind the Scenes

1. You make a request
2. The AI matches your request to the relevant skill
3. The skill loads its rules and reference documents
4. The AI follows those rules while generating code or feedback

For example, when you say "review my code," the Code Review skill loads two reference documents:

- **Architectural Standards** — checks for KISS, DRY, SOLID, Composition, and Accessibility
- **Security Standards** — checks for XSS vulnerabilities, data leaks, and unsafe patterns

The AI then produces a structured report with findings rated by severity (Critical, High, Medium, Low).

## Skill Details

### 1. Code Review

**What it checks (Architecture):**

- Is the logic simple enough? (KISS)
- Is code repeated 3+ times? (DRY)
- Does one component do too many jobs? (Single Responsibility)
- Are there speculative "just in case" features? (YAGNI)
- Are feature files in the right folder? (Colocation)
- Are there too many boolean props? (Composition)
- Are there hidden side effects? (Predictability)
- Is it keyboard and screen-reader accessible? (A11y)

**What it checks (Security):**

- Raw user input in HTML attributes (XSS)
- Sensitive data in localStorage or URLs
- Non-HTTPS API calls
- Outdated dependencies with known vulnerabilities
- Client-side-only authorization checks

**Output format:** A structured report with severity ratings and top 3 priority fixes.

### 2. FDD Architecture

**Rules it enforces:**

| Rule                | What it means                                                                 |
| ------------------- | ----------------------------------------------------------------------------- |
| Feature co-location | All feature code lives in `src/features/[name]/`                              |
| Public API boundary | Features export through `index.ts` only                                       |
| Relative imports    | Use `../hooks/use-auth` inside a feature, not `@features/auth/hooks/use-auth` |
| Kebab-case naming   | Files use `my-component.tsx`, not `MyComponent.tsx`                           |
| Named imports       | Use `import { useState }`, not `import * as React`                            |
| Rule of Three       | Only move to `shared/` after 3+ features use it                               |
| Max 3 levels deep   | No deeply nested folder structures                                            |
| Hook extraction     | Separate business logic from UI components                                    |

See [Architecture Guide](architecture.md) for the full explanation of these rules.

### 3. Tailwind v4 Best Practices

**What it enforces:**

- Use semantic design tokens (`bg-primary`) instead of direct colors (`bg-blue-500`)
- Use OKLCh color format for design tokens
- Use `@theme inline` for token configuration
- Follow component styling patterns that scale
- Use proper dark mode implementation via CSS custom properties

### 4. React Composition Patterns

**Key patterns it teaches:**

| Pattern                    | Problem it solves                               |
| -------------------------- | ----------------------------------------------- |
| Compound Components        | Components with 10+ boolean props               |
| Children over Render Props | Callback-heavy component APIs                   |
| Explicit Variants          | Hidden conditional rendering logic              |
| Context Interface          | Prop drilling through multiple levels           |
| State Decoupling           | Tightly coupled state implementations           |
| No forwardRef (React 19)   | `ref` is now a regular prop — no wrapper needed |

### 5. React Best Practices (Vercel)

**65 rules across 8 categories:**

| Category     | Examples                                                       |
| ------------ | -------------------------------------------------------------- |
| Re-rendering | Derived state instead of effects, functional setState, useMemo |
| Rendering    | Conditional rendering, content visibility, hydration           |
| Bundle size  | Dynamic imports, lazy loading, avoiding barrel imports         |
| Async        | Parallel fetching, Suspense boundaries, deferred awaits        |
| JavaScript   | Early exits, Set/Map lookups, hoisted RegExp                   |
| Client-side  | Event listeners, localStorage schema, SWR deduplication        |
| Server-side  | Caching, parallel fetching, auth in actions                    |
| Advanced     | Event handler refs, init-once patterns                         |

## Installation

Skills are installed automatically during project setup:

```bash
./setup-ai-skills.sh          # First-time install
./setup-ai-skills.sh --force  # Reinstall all skills
```

This script:

1. Downloads skills from two sources (Vercel Labs + custom repository)
2. Installs them to `.agents/skills/`
3. Creates `.claude/settings.local.json` with permission defaults

### Where Skills Live

```
.agents/skills/
├── code-review/
│   ├── SKILL.md                          ← Main skill definition
│   └── references/
│       ├── architectural-standards.md    ← Coding principles checklist
│       └── security-standards.md         ← Security review checklist
├── fdd-architecture/
│   ├── SKILL.md
│   └── rules/                            ← 9 individual rule files
├── tailwind-v4-best-practices/
│   ├── SKILL.md
│   └── references/                       ← Design system patterns
├── vercel-composition-patterns/
│   ├── SKILL.md
│   └── rules/                            ← 8 pattern files
└── vercel-react-best-practices/
    ├── SKILL.md
    └── rules/                            ← 65 rule files
```

### Skill File Structure

Each skill follows the same pattern:

| File          | Purpose                                                                           |
| ------------- | --------------------------------------------------------------------------------- |
| `SKILL.md`    | The main instruction set — tells the AI what this skill does and when to activate |
| `rules/`      | Individual rule files with correct/incorrect examples                             |
| `references/` | Reference documents the AI consults during reviews                                |
| `AGENTS.md`   | Agent-specific configuration (used by some skills)                                |

## Creating New Skills

To create a new skill for this project:

1. Ask Claude Code: _"Create a new skill for [topic]"_
2. The `skill-creator` meta-skill handles the scaffolding
3. The new skill is saved to `.agents/skills/[name]/`
4. Add the skill source to `setup-ai-skills.sh` for team distribution

Skills can also be tested with evaluations (`evals/evals.json`) to measure how well the AI follows the rules.

## Relationship to Documentation

Skills and docs serve different audiences:

|              | Skills                               | Docs                              |
| ------------ | ------------------------------------ | --------------------------------- |
| **Audience** | AI coding tools                      | Humans                            |
| **Format**   | Machine-readable rules with triggers | Prose with analogies and examples |
| **Purpose**  | Enforce standards automatically      | Explain standards and reasoning   |
| **Location** | `.agents/skills/`                    | `docs/`                           |

They cover the same standards from different angles. When you update a principle in the docs, the corresponding skill rule should be updated too — and vice versa.
