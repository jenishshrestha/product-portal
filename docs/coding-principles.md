# Coding Principles

The rules for writing clean, maintainable code in this project — explained for everyone.

## Why Do We Need Principles?

Imagine building a house. You could technically wire the electricity however you want — it might even work. But without following electrical codes, the house becomes dangerous to modify, hard to inspect, and impossible for another electrician to understand.

Coding principles are our "building codes." They keep the codebase safe, understandable, and easy to change — whether a human or an AI is writing the code.

---

## 1. KISS — Keep It Simple

**In plain English:** If a 5-year-old can't follow the logic, it's too complicated.

**The idea:** Always choose the simplest solution that works. Don't show off with clever one-liners or complex patterns when a straightforward approach does the job.

### What it looks like

**Too clever (hard to understand at a glance):**

```tsx
const label = items?.length ? items.length > 1 ? `${items.length} items` : items[0].name : "No items";
```

**Simple (anyone can read this):**

```tsx
function getLabel(items) {
  if (!items || items.length === 0) return "No items";
  if (items.length === 1) return items[0].name;
  return `${items.length} items`;
}
```

Both produce the same result. The second one is easier to read, debug, and modify.

### How to check

Ask yourself: *"If someone opened this file for the first time, would they understand what's happening within 10 seconds?"*

If the answer is no, simplify.

---

## 2. DRY — Don't Repeat Yourself (with the Rule of Three)

**In plain English:** If you find yourself copy-pasting the same code, something is wrong — but don't jump to fix it too early.

**The idea:** Duplicated code is a maintenance problem. If you fix a bug in one copy, you have to remember to fix it in all the others. But the cure can be worse than the disease if you abstract too early.

### The Rule of Three

| Occurrence | What to do |
|------------|-----------|
| **1st time** | Just write it |
| **2nd time** | Note the duplication, but leave it |
| **3rd time** | Now extract it into a reusable piece |

### What it looks like

**Repeated 3 times (time to extract):**

```tsx
// In ContactCard
const fullName = `${user.firstName} ${user.lastName}`.trim();

// In ProfileHeader
const fullName = `${user.firstName} ${user.lastName}`.trim();

// In EmailTemplate
const fullName = `${user.firstName} ${user.lastName}`.trim();
```

**Extracted into a reusable function:**

```tsx
// src/shared/lib/utils.ts
function getFullName(user) {
  return `${user.firstName} ${user.lastName}`.trim();
}

// Now used everywhere
const fullName = getFullName(user);
```

### Why wait until the third time?

The first two uses might evolve differently. Maybe the email template eventually needs "Mr./Ms." in front. If you had extracted too early, you'd end up with a function full of special cases. Waiting reveals the *real* pattern.

---

## 3. SOLID — Five Rules for Clean Code

SOLID is a set of five principles. Think of them as five habits that keep code from turning into a tangled mess.

### S — Single Responsibility

**In plain English:** Every piece of code should do one thing and do it well.

**Real-world analogy:** A chef cooks. A waiter serves. You don't want your chef also taking orders at the table — that's how things get dropped.

**Too many responsibilities (data + URL logic + display):**

```tsx
function ContactsList() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Fetching data
  useEffect(() => {
    fetch("/api/contacts").then(res => res.json()).then(setContacts);
  }, []);

  // Syncing with URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("q") || "");
  }, []);

  // Filtering
  const filtered = contacts.filter(c => c.name.includes(search));

  // Rendering
  return <ul>{filtered.map(c => <li key={c.id}>{c.name}</li>)}</ul>;
}
```

**Each piece has one job:**

```tsx
// Hook handles data fetching (one job)
function useContacts() {
  return useQuery({ queryKey: ["contacts"], queryFn: fetchContacts });
}

// Hook handles filtering (one job)
function useContactFilter(contacts, search) {
  return contacts.filter(c => c.name.includes(search));
}

// Component handles display (one job)
function ContactsList() {
  const { data: contacts } = useContacts();
  const filtered = useContactFilter(contacts, search);
  return <ul>{filtered.map(c => <li key={c.id}>{c.name}</li>)}</ul>;
}
```

### O — Open/Closed

**In plain English:** You should be able to add new behavior without changing existing code.

**Real-world analogy:** A power strip lets you plug in new devices without rewiring the wall. Adding a new device doesn't require modifying the power strip itself.

**Needs modification to add new types:**

```tsx
function NotificationIcon({ type }) {
  if (type === "success") return <CheckIcon />;
  if (type === "error") return <XIcon />;
  if (type === "warning") return <AlertIcon />;
  // Adding "info" means changing this function
}
```

**Open for extension, closed for modification:**

```tsx
const NOTIFICATION_ICONS = {
  success: CheckIcon,
  error: XIcon,
  warning: AlertIcon,
};

function NotificationIcon({ type }) {
  const Icon = NOTIFICATION_ICONS[type];
  return Icon ? <Icon /> : null;
}

// Adding "info" = just add to the map, no function changes
NOTIFICATION_ICONS.info = InfoIcon;
```

### L — Liskov Substitution

**In plain English:** If something promises to work a certain way, every version of it must keep that promise.

**Real-world analogy:** If you order "any sedan" from a rental company, every sedan they give you should have the same basic controls — steering wheel, brake, gas pedal. You shouldn't get one that steers with a joystick.

In React, this means a custom component that wraps a standard element (like `<button>`) should accept all the same props and behave the same way.

### I — Interface Segregation

**In plain English:** Don't force someone to accept things they don't need.

**Real-world analogy:** A TV remote with 80 buttons when you only use 5. The unused buttons are just noise.

**Too much required:**

```tsx
// Forces every user to provide ALL these props
function UserCard({ name, email, phone, address, avatar, bio, joinDate, role }) {
  return <div>{name}</div>; // Only uses name!
}
```

**Only ask for what you need:**

```tsx
function UserCard({ name, avatar }) {
  return <div>{name}</div>;
}
```

### D — Dependency Inversion

**In plain English:** High-level plans shouldn't depend on low-level details. Both should depend on agreements (interfaces).

**Real-world analogy:** A wall outlet is an agreement. Any device with a matching plug works. The house wiring doesn't care if you plug in a lamp or a laptop. The device doesn't care how the power was generated.

In this project, features don't reach into each other's internals. They communicate through public APIs (`index.ts`) — the "outlet" that both sides agree on.

---

## 4. YAGNI — You Aren't Gonna Need It

**In plain English:** Don't build it until you actually need it.

**The idea:** It's tempting to add "just in case" features, extra configuration options, or future-proofing code. Resist the urge. Most of it will never be used, and it clutters the codebase.

### What it looks like

**Speculative "just in case" code:**

```tsx
function Button({
  variant,
  size,
  isAnimated,       // ← Nobody uses this yet
  animationDuration, // ← Nobody uses this yet
  onLongPress,      // ← Nobody uses this yet
  hapticFeedback,   // ← Nobody uses this yet
}) { ... }
```

**Only what's needed today:**

```tsx
function Button({ variant, size }) { ... }
```

### How to check

Ask yourself: *"Am I building this because I need it right now, or because I think I might need it someday?"*

If the answer is "someday" — don't build it. You can always add it later when there's a real use case.

---

## 5. Colocation — Keep Related Things Together

**In plain English:** Things that work together should live together.

**The idea:** Don't scatter related files across the project. A component's test, story, and styles should sit right next to it — not in separate `tests/`, `stories/`, or `styles/` folders at the root.

This is the backbone of our [Architecture](architecture.md) (Feature-Driven Development).

### What it looks like

**Scattered (hard to find related files):**

```
src/
├── components/contacts-card.tsx
├── tests/contacts-card.test.tsx        ← far away
├── stories/contacts-card.stories.tsx   ← far away
├── hooks/use-contacts.ts              ← far away
└── types/contact.ts                   ← far away
```

**Colocated (everything together):**

```
src/features/contacts/
├── components/
│   ├── contacts-card.tsx
│   ├── contacts-card.test.tsx          ← right here
│   └── contacts-card.stories.tsx       ← right here
├── hooks/use-contacts.ts              ← right here
├── types/contact.ts                   ← right here
└── index.ts
```

### Why it matters

- **Finding things:** "Where's the test for this component?" → Same folder. Always.
- **Deleting things:** Remove a feature = delete one folder. No orphaned files left behind.
- **Understanding things:** Open a folder, see everything related to that piece of the app.

---

## 6. Composition Over Configuration

**In plain English:** Build complex things by combining simple pieces, not by adding more switches to one big thing.

**The idea:** Instead of creating a single component with dozens of props (boolean flags, render callbacks, mode switches), create small, focused pieces that can be assembled like building blocks.

**Real-world analogy:** Think of LEGO. You don't have one giant brick with switches that change its shape. You have many small bricks that snap together to create anything.

### The Problem: Boolean Prop Explosion

Every boolean prop doubles the number of possible states. Three booleans = 8 possible combinations. Ten booleans = 1,024 combinations. Testing and maintaining that is a nightmare.

**Too many switches (10+ booleans):**

```tsx
<MessageComposer
  isThread={true}
  isDM={false}
  isEditing={false}
  showAttachments={true}
  showFormatting={true}
  showEmojis={false}
  isForwarding={false}
/>
```

**Composed from simple pieces:**

```tsx
<Composer.Frame>
  <Composer.Input />
  <AlsoSendToChannelField id={channelId} />
  <Composer.Footer>
    <Composer.Attachments />
    <Composer.Formatting />
    <Composer.Submit />
  </Composer.Footer>
</Composer.Frame>
```

Each variant is explicit about what it renders. No hidden conditionals, no guessing which combination of booleans produces which behavior.

### When to refactor

If a component has **4+ boolean props** that control what gets rendered, it's time to break it into composable pieces (compound components).

---

## 7. Explicit Predictability

**In plain English:** Code should do what it looks like it does. No surprises.

**The idea:** Hidden side effects — things that happen behind the scenes without being obvious — are one of the biggest sources of bugs. Make every action visible and intentional.

### What it looks like

**Hidden side effect (surprise!):**

```tsx
function SearchInput() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    // This silently updates the URL every time query changes
    // Someone reading the JSX below would never know
    window.history.replaceState({}, "", `?q=${query}`);
  }, [query]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

**Explicit (no surprises):**

```tsx
function SearchInput() {
  const [query, setQuery] = useState("");

  function handleSearch(value) {
    setQuery(value);
    updateURLParam("q", value);  // Clearly visible
  }

  return <input value={query} onChange={e => handleSearch(e.target.value)} />;
}
```

### How to check

Read only the JSX return statement. Can you tell what the component does? If there are invisible behaviors hidden in `useEffect` blocks, make them explicit through named functions or event handlers.

---

## 8. Accessibility (A11y)

**In plain English:** The app should work for everyone — including people who use keyboards, screen readers, or other assistive tools.

**The idea:** Accessibility isn't an afterthought or a nice-to-have. It's a quality standard, just like type safety or code formatting.

### The basics

| Requirement | What it means |
|-------------|--------------|
| **Keyboard navigation** | Every interactive element can be reached and activated with the keyboard |
| **ARIA labels** | Screen readers can announce what an element does |
| **Alt text** | Images have descriptions for users who can't see them |
| **Color contrast** | Text is readable against its background |
| **Focus indicators** | Users can see which element is currently selected |

### What it looks like

**Inaccessible:**

```tsx
<div onClick={handleClick}>Click me</div>
```

**Accessible:**

```tsx
<button type="button" onClick={handleClick}>Click me</button>
```

The `<button>` automatically handles keyboard events (Enter/Space), focus management, and screen reader announcements. The `<div>` does none of that.

Our shadcn/ui components (built on Radix UI) handle most accessibility automatically. The main rule: **use the right semantic element** and **add labels to icons and images**.

---

## Quick Reference Card

| Principle | One-liner | When to apply |
|-----------|-----------|---------------|
| **KISS** | Simplest solution that works | Writing any code |
| **DRY** | Extract on the 3rd repetition | Noticing copy-paste |
| **Single Responsibility** | One job per piece | Components and hooks |
| **Open/Closed** | Extend without modifying | Adding new variants |
| **YAGNI** | Don't build "just in case" | Planning features |
| **Colocation** | Related files live together | Organizing code |
| **Composition** | Small pieces over big switches | Components with 4+ boolean props |
| **Predictability** | No hidden side effects | Event handlers and effects |
| **Accessibility** | Works for everyone | Every interactive element |
