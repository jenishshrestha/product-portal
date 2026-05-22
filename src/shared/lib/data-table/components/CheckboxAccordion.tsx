import { Checkbox } from "@shared/components/ui/Checkbox";
import { Input } from "@shared/components/ui/Input";
import { cn } from "@shared/lib/utils";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { createContext, use, useId, useMemo, useState } from "react";

/**
 * Compound component ported from Atlas's CheckboxAccordion.
 *
 *   <CheckboxAccordion.Root>
 *     <CheckboxAccordion.Header title="Country" badgeCount={2} />
 *     <CheckboxAccordion.Search placeholder="Search countries..." />
 *     <CheckboxAccordion.List>
 *       <CheckboxAccordion.Item label="Nepal" value="Nepal" checked={...} onChange={...} />
 *     </CheckboxAccordion.List>
 *   </CheckboxAccordion.Root>
 */

interface CheckboxAccordionContextValue {
  isOpen: boolean;
  toggle: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  id: string;
}

const CheckboxAccordionContext = createContext<CheckboxAccordionContextValue | null>(null);

function useCheckboxAccordion() {
  const ctx = use(CheckboxAccordionContext);
  if (!ctx) {
    throw new Error("CheckboxAccordion components must be used within CheckboxAccordion.Root");
  }
  return ctx;
}

// ─── Root ───

function Root({
  children,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [searchQuery, setSearchQuery] = useState("");
  const id = useId();

  const value = useMemo(
    () => ({
      isOpen,
      toggle: () => setIsOpen((prev) => !prev),
      searchQuery,
      setSearchQuery,
      id,
    }),
    [isOpen, searchQuery, id],
  );

  return (
    <CheckboxAccordionContext value={value}>
      <div className="flex flex-col rounded-xl border border-border bg-background px-4 py-3">
        {children}
      </div>
    </CheckboxAccordionContext>
  );
}

// ─── Header ───

interface HeaderProps {
  title: string;
  badgeCount?: number;
  onClear?: () => void;
}

function Header({ title, badgeCount, onClear }: HeaderProps) {
  const { isOpen, toggle, id } = useCheckboxAccordion();

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${id}`}
        className="flex flex-1 items-center gap-2 rounded-md text-left transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="ml-auto flex items-center gap-3">
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold leading-4 text-primary-foreground">
              {badgeCount}
            </span>
          )}
          <ChevronDownIcon
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </span>
      </button>

      {onClear && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
          className="px-2 text-xs font-medium text-primary transition-colors hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Search (only visible when open) ───

function Search({ placeholder = "Search..." }: { placeholder?: string }) {
  const { isOpen, searchQuery, setSearchQuery } = useCheckboxAccordion();
  if (!isOpen) {
    return null;
  }

  return (
    <div className="mt-3 mb-3">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="h-8 pl-8 text-sm"
        />
      </div>
    </div>
  );
}

// ─── List wrapper ───

function List({ children }: { children: React.ReactNode }) {
  const { isOpen, id } = useCheckboxAccordion();
  if (!isOpen) {
    return null;
  }

  return (
    <section
      id={`accordion-content-${id}`}
      className="flex max-h-[300px] flex-col gap-3 overflow-y-auto pr-2"
    >
      {children}
    </section>
  );
}

// ─── Highlight helper ───

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) {
    return <>{text}</>;
  }
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            // biome-ignore lint/suspicious/noArrayIndexKey: split parts are stable within one render
            key={i}
            className="rounded-sm bg-primary/20 font-semibold text-primary"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

// ─── Item (leaf checkbox) ───

interface ItemProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: string, checked: boolean) => void;
  indentLevel?: number;
}

function Item({ label, value, checked, onChange, indentLevel = 0 }: ItemProps) {
  const { searchQuery } = useCheckboxAccordion();
  const itemId = useId();

  // Hide items that don't match the search
  if (searchQuery && !label.toLowerCase().includes(searchQuery.toLowerCase())) {
    return null;
  }

  return (
    <label
      htmlFor={itemId}
      className="flex cursor-pointer items-center gap-3 rounded-md py-1.5 transition-colors"
      style={{ paddingLeft: indentLevel > 0 ? `${indentLevel}rem` : "0rem" }}
    >
      <div className="flex size-4 items-center justify-center">
        <Checkbox
          id={itemId}
          checked={checked}
          onCheckedChange={(c) => onChange(value, c === true)}
        />
      </div>
      <span className="select-none text-[0.813rem] leading-4 text-muted-foreground">
        <Highlight text={label} query={searchQuery} />
      </span>
    </label>
  );
}

// ─── HeaderCheckbox (parent with indeterminate state) ───

interface HeaderCheckboxProps {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  indentLevel?: number;
}

function HeaderCheckbox({
  label,
  checked,
  indeterminate,
  onChange,
  indentLevel = 0,
}: HeaderCheckboxProps) {
  const { searchQuery } = useCheckboxAccordion();
  const itemId = useId();

  return (
    <label
      htmlFor={itemId}
      className="flex cursor-pointer items-center gap-3 rounded-md py-1.5 font-medium transition-colors hover:bg-muted/50"
      style={{ paddingLeft: indentLevel > 0 ? `${indentLevel}rem` : "0.5rem" }}
    >
      <div className="flex size-4 items-center justify-center">
        <Checkbox
          id={itemId}
          checked={indeterminate ? "indeterminate" : checked}
          onCheckedChange={(c) => onChange(c === true)}
        />
      </div>
      <span className="select-none text-sm leading-4 text-foreground">
        <Highlight text={label} query={searchQuery} />
      </span>
    </label>
  );
}

export const CheckboxAccordion = {
  Root,
  Header,
  Search,
  List,
  Item,
  HeaderCheckbox,
};
