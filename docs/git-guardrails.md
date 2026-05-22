# Git Guardrails

How this project automatically prevents mistakes before they reach the team — explained for everyone.

## What Are Git Guardrails?

Think of guardrails on a highway — they don't slow you down, but they stop you from going off the edge. This project has three automatic checkpoints that run every time you save your work (commit) or share it (push). You don't have to remember to run them — they happen automatically.

These checkpoints are powered by a tool called **Husky**, which runs scripts at key moments in your workflow.

## The Three Checkpoints

```
You write code
     ↓
┌─────────────┐
│  Checkpoint 1│  ← When you commit
│  Pre-Commit  │     "Is your code clean?"
└──────┬──────┘
       ↓
┌─────────────┐
│  Checkpoint 2│  ← When you commit
│  Commit Msg  │     "Is your message clear?"
└──────┬──────┘
       ↓
┌─────────────┐
│  Checkpoint 3│  ← When you push
│  Pre-Push    │     "Does everything still work?"
└──────┬──────┘
       ↓
  Code is shared
```

---

## Checkpoint 1: Pre-Commit (Code Quality)

**When it runs:** Every time you commit code.

**What it does:** Automatically formats and lints only the files you changed — not the entire project.

**How it works:**
1. You run `git commit`
2. Husky triggers `lint-staged`
3. lint-staged sends your changed files through **Biome** (our code quality tool)
4. Biome fixes formatting issues automatically and flags any errors

**What gets checked:**
- Consistent indentation and spacing
- Missing semicolons or brackets
- Unused variables
- Accessibility issues in HTML
- Common coding mistakes

### Example: What it catches

**Before (you wrote this):**
```tsx
const   name="hello"
if(name=="hello") console.log(name)
```

**After (Biome auto-fixes):**
```tsx
const name = "hello";
if (name === "hello") {
  console.log(name);
}
```

Some issues are auto-fixed (formatting, spacing). Others block the commit and ask you to fix them manually (actual errors, accessibility violations).

### What happens if it fails?

Your commit is **blocked**. You'll see an error message explaining what's wrong. Fix the issue and try committing again. Your work is never lost — it's still in your files, just not committed yet.

---

## Checkpoint 2: Commit Message (Communication)

**When it runs:** Every time you commit code.

**What it does:** Ensures your commit message follows a consistent format called **Conventional Commits**.

**Why it matters:** When something breaks, the team needs to quickly scan the history and understand what changed. Consistent messages make this possible.

### The Format

```
type(scope): description

Examples:
  feat: add contacts page
  fix(auth): resolve login timeout issue
  docs: update setup instructions
  refactor(shared): extract form validation hook
  style: fix button alignment on mobile
```

### Available Types

| Type | When to use | Example |
|------|-------------|---------|
| `feat` | Adding something new | `feat: add dark mode toggle` |
| `fix` | Fixing a bug | `fix: resolve cart total calculation` |
| `docs` | Documentation only | `docs: add API endpoint examples` |
| `style` | Visual/formatting changes (no logic) | `style: align header spacing` |
| `refactor` | Reorganizing code (no behavior change) | `refactor: simplify auth hook` |
| `perf` | Performance improvements | `perf: lazy-load dashboard charts` |
| `test` | Adding or updating tests | `test: add login form validation tests` |
| `build` | Build system or dependencies | `build: upgrade React to v19` |
| `ci` | CI/CD pipeline changes | `ci: add staging deploy step` |
| `chore` | Maintenance tasks | `chore: clean up unused imports` |
| `revert` | Undoing a previous commit | `revert: undo cart feature changes` |

### The Optional Scope

The part in parentheses `(scope)` is optional. Use it to specify which area of the project was affected:

```
fix(auth): resolve token refresh race condition
     ↑
     scope = the auth feature
```

Common scopes: `auth`, `shared`, `home`, `ui`, or any feature name.

### What happens if it fails?

Your commit is **blocked** with a message like:

```
Invalid commit message format.

Valid format: <type>(scope?): <description>

Types: feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert

Examples:
  feat: add login page
  fix(auth): resolve token refresh race condition
  docs: update README with setup instructions
```

Fix your message and commit again. Your code changes are preserved — only the message needs updating.

---

## Checkpoint 3: Pre-Push (Build Verification)

**When it runs:** Every time you push code to the remote repository.

**What it does:** Runs two checks to make sure your code won't break the project for everyone else:

1. **Type Check** (`bun run type-check`) — Verifies that all TypeScript types are correct
2. **Production Build** (`bun run build`) — Attempts to build the entire project, exactly like it would be built for production

### Example: What it catches

**Type error:**
```tsx
// You wrote this — 'nme' is a typo
function greet(user: User) {
  return `Hello, ${user.nme}`;
  //                    ^^^ Property 'nme' does not exist on type 'User'
}
```

**Build error:**
```tsx
// You imported from a file that doesn't exist
import { helpers } from "./old-helpers";  // ← file was deleted
```

### What happens if it fails?

Your push is **blocked**. The error output shows exactly what went wrong and where. Fix the issue, commit the fix, and push again.

### Why at push time?

Running a full build on every commit would be slow and annoying. By running it only when you push, you get fast commits during development but still catch problems before they affect the team.

---

## Common Scenarios

### Scenario 1: Quick Fix

```bash
# You fix a typo in a button label
git add src/features/home/components/HeroSection.tsx
git commit -m "fix: correct CTA button label typo"
git push
```

What happens:
1. Pre-commit: Biome formats your file ✅
2. Commit message: Valid format (`fix: ...`) ✅
3. Pre-push: Type check passes, build succeeds ✅
4. Code is pushed 🎉

### Scenario 2: Bad Commit Message

```bash
git commit -m "fixed stuff"
```

What happens:
1. Pre-commit: passes ✅
2. Commit message: **BLOCKED** ❌ — "fixed stuff" doesn't match the format
3. You fix it:
```bash
git commit -m "fix(auth): resolve session expiry redirect"
```
4. Now it passes ✅

### Scenario 3: Lint Error

```bash
git commit -m "feat: add search bar"
```

What happens:
1. Pre-commit: Biome finds an accessibility issue ❌
```
src/features/search/components/search-bar.tsx
  error: <img> missing alt text (lint/a11y/useAltText)
```
2. You add the alt text, stage the file again, and re-commit ✅

### Scenario 4: Build Breaks on Push

```bash
git push
```

What happens:
1. Pre-push runs type-check → finds an error ❌
```
error TS2339: Property 'nmae' does not exist on type 'User'.
  Did you mean 'name'?
```
2. You fix the typo, commit the fix, and push again ✅

---

## How to Bypass (Emergency Only)

In rare emergencies, you can skip hooks. **This should almost never be used** — it defeats the purpose of having guardrails.

```bash
# Skip pre-commit and commit-msg hooks
git commit --no-verify -m "hotfix: emergency production fix"

# Skip pre-push hook
git push --no-verify
```

**When this is acceptable:**
- A production outage requires an immediate hotfix
- A hook itself is broken and needs to be fixed

**When this is NOT acceptable:**
- Your code has lint errors you don't want to fix
- You're "just pushing a small change"
- You're in a hurry

---

## Summary

| Checkpoint | Trigger | What it checks | If it fails |
|------------|---------|---------------|-------------|
| **Pre-Commit** | `git commit` | Code formatting and lint rules | Commit is blocked, fix errors |
| **Commit Message** | `git commit` | Message follows `type(scope): desc` | Commit is blocked, rewrite message |
| **Pre-Push** | `git push` | TypeScript types + production build | Push is blocked, fix errors |

All three guardrails work together to ensure that every piece of code that reaches the team is clean, well-documented, and doesn't break the build.
