import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@shared/components/ui/Combobox";
import { Input } from "@shared/components/ui/Input";
import { NativeSelect } from "@shared/components/ui/NativeSelect";
import { Slider } from "@shared/components/ui/Slider";
import { usePermissions } from "@shared/hooks";
import {
  FilterDropdown,
  useDataTableAdvancedFilters,
  useDataTableSearch,
} from "@shared/lib/data-table";
import { cn } from "@shared/lib/utils";
import { SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useCountries, useFilterOptions } from "../api/useProducts";
import { STATUS_LABELS } from "../lib/product-format";
import { type Country, PRODUCT_STATUSES, type ProductStatus } from "../types/product.types";
import { StudyLevelFilter } from "./StudyLevelFilter";

const ENGLISH_TEST_OPTIONS = [
  { label: "IELTS", value: "IELTS" },
  { label: "TOEFL (before Jan 2026)", value: "TOEFL (before January 2026)" },
  { label: "TOEFL (Jan 2026 onwards)", value: "TOEFL (January 2026 onwards)" },
  { label: "PTE", value: "PTE" },
  { label: "Duolingo", value: "Duolingo" },
] as const;

const CURRENCY_OPTIONS = ["AUD", "CAD", "GBP", "NZD", "USD"] as const;

const CURRENCY_CONFIG: Record<string, { max: number; step: number }> = {
  AUD: { max: 1_000_000, step: 10_000 },
  CAD: { max: 1_000_000, step: 10_000 },
  GBP: { max: 1_000_000, step: 10_000 },
  NZD: { max: 1_000_000, step: 10_000 },
  USD: { max: 1_000_000, step: 10_000 },
  "": { max: 1_000_000, step: 10_000 },
};

const STATUS_OPTIONS = PRODUCT_STATUSES.map((value) => ({
  label: STATUS_LABELS[value],
  value,
}));

function formatFee(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function countryFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export function ProductFilterBar() {
  const { isSuperadmin } = usePermissions();
  const { globalFilter, setGlobalFilter } = useDataTableSearch();
  const advanced = useDataTableAdvancedFilters();
  const { data: filterOptions } = useFilterOptions();
  const { data: allCountries = [] } = useCountries();

  const institutionOptions = filterOptions?.institutions ?? [];
  const studyAreaOptions = filterOptions?.studyAreas ?? [];

  const currency = advanced.filters.feesCurrency?.[0] ?? "";
  const { max: feeConfigMax, step: feeStep } = CURRENCY_CONFIG[currency] ?? {
    max: 3_000_000,
    step: 50_000,
  };

  const feeMin =
    advanced.filters.feesMin?.[0] !== undefined ? Number(advanced.filters.feesMin[0]) : 0;
  const feeMax =
    advanced.filters.feesMax?.[0] !== undefined
      ? Number(advanced.filters.feesMax[0])
      : feeConfigMax;
  const feeIsDefault = feeMin === 0 && feeMax === feeConfigMax;

  const feeLabel = feeIsDefault
    ? "Any"
    : `${currency ? `${currency} ` : ""}$${formatFee(feeMin)} – $${formatFee(feeMax)}`;

  function handleFeeChange(values: number[]) {
    const [min, max] = values;
    const { feesMin: _min, feesMax: _max, ...rest } = advanced.filters;
    const next: Record<string, string[]> = { ...rest };
    if ((min ?? 0) > 0) next.feesMin = [String(min)];
    if ((max ?? feeConfigMax) < feeConfigMax) next.feesMax = [String(max)];
    advanced.setFilters(next);
  }

  function handleCurrencyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const { feesMin: _min, feesMax: _max, feesCurrency: _curr, ...rest } = advanced.filters;
    advanced.setFilters(e.target.value ? { ...rest, feesCurrency: [e.target.value] } : rest);
  }

  const hasInstitution = (advanced.filters.institution?.length ?? 0) > 0;
  const hasCountry = (advanced.filters.country?.length ?? 0) > 0;
  const hasQT = (advanced.filters.qualificationType?.length ?? 0) > 0;
  const hasStudyArea = (advanced.filters.studyArea?.length ?? 0) > 0;
  const hasStatus = (advanced.filters.status?.length ?? 0) > 0;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      {/* Row 1: search + dropdown filters */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-3">
        <FilterField label="Course Name" className="min-w-[160px] flex-[0.8]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-8 pr-7 text-sm"
              placeholder="Search courses..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
            {globalFilter && (
              <button
                type="button"
                onClick={() => setGlobalFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
        </FilterField>

        <FilterField
          label="Institution"
          className="min-w-[160px] flex-[0.96]"
          onClear={hasInstitution ? () => advanced.setSection("institution", []) : undefined}
        >
          <MultiCombobox
            options={institutionOptions}
            selected={advanced.filters.institution ?? []}
            onSelectedChange={(v) => advanced.setSection("institution", v)}
            placeholder="Search institutions…"
          />
        </FilterField>

        <FilterField
          label="Country"
          className="min-w-[180px] flex-1"
          onClear={hasCountry ? () => advanced.setSection("country", []) : undefined}
        >
          <CountryCombobox
            countries={allCountries}
            selected={advanced.filters.country ?? []}
            onSelectedChange={(v) => advanced.setSection("country", v)}
          />
        </FilterField>

        <FilterField
          label="Study Level"
          onClear={hasQT ? () => advanced.setSection("qualificationType", []) : undefined}
        >
          <StudyLevelFilter
            selected={advanced.filters.qualificationType ?? []}
            onSelectedChange={(v) => advanced.setSection("qualificationType", v)}
          />
        </FilterField>

        <FilterField
          label="Study Area"
          onClear={hasStudyArea ? () => advanced.setSection("studyArea", []) : undefined}
        >
          <FilterDropdown
            label="Study Area"
            options={studyAreaOptions}
            selected={advanced.filters.studyArea ?? []}
            onSelectedChange={(v) => advanced.setSection("studyArea", v)}
            searchable
            searchPlaceholder="Search areas..."
          />
        </FilterField>

        {isSuperadmin && (
          <FilterField
            label="Status"
            onClear={hasStatus ? () => advanced.setSection("status", []) : undefined}
          >
            <FilterDropdown
              label="Status"
              options={STATUS_OPTIONS}
              selected={advanced.filters.status ?? []}
              onSelectedChange={(v) => advanced.setSection("status", v as ProductStatus[])}
              multiple={false}
            />
          </FilterField>
        )}
      </div>

      <div className="-mx-4 border-t border-border" />

      {/* Row 2: range + score filters */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
        {/* Tuition Fee */}
        <div className="space-y-2 max-w-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Tuition Fee
              </span>
              <NativeSelect
                className="h-6 border-0 bg-transparent py-0 pl-0 pr-6 text-xs shadow-none focus-visible:ring-0"
                value={currency}
                onChange={handleCurrencyChange}
              >
                <option value="">Any</option>
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{feeLabel}</span>
              {!feeIsDefault && (
                <button
                  type="button"
                  onClick={() => {
                    const { feesMin: _min, feesMax: _max, ...rest } = advanced.filters;
                    advanced.setFilters(rest);
                  }}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Reset fee range"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          </div>
          <Slider
            min={0}
            max={feeConfigMax}
            step={feeStep}
            value={[feeMin, feeMax]}
            onValueChange={handleFeeChange}
            className="[&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:size-3.5"
          />
        </div>

        {/* Intake Date Range */}
        <div className="space-y-2">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Intake Date Range
          </span>
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Input
                type="date"
                className="h-8 text-sm"
                value={advanced.filters.intakeDateFrom?.[0] ?? ""}
                onChange={(e) =>
                  advanced.setSection("intakeDateFrom", e.target.value ? [e.target.value] : [])
                }
              />
              {advanced.filters.intakeDateFrom?.[0] && (
                <button
                  type="button"
                  onClick={() => advanced.setSection("intakeDateFrom", [])}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear from date"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">–</span>
            <div className="relative flex-1">
              <Input
                type="date"
                className="h-8 text-sm"
                value={advanced.filters.intakeDateTo?.[0] ?? ""}
                onChange={(e) =>
                  advanced.setSection("intakeDateTo", e.target.value ? [e.target.value] : [])
                }
              />
              {advanced.filters.intakeDateTo?.[0] && (
                <button
                  type="button"
                  onClick={() => advanced.setSection("intakeDateTo", [])}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear to date"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* English Language Score */}
        <div className="space-y-2">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
            English Language Score
          </span>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <NativeSelect
                className="h-8 w-[140px] text-sm"
                value={advanced.filters.englishTest?.[0] ?? ""}
                onChange={(e) =>
                  advanced.setSection("englishTest", e.target.value ? [e.target.value] : [])
                }
              >
                <option value="">Any test</option>
                {ENGLISH_TEST_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
              {advanced.filters.englishTest?.[0] && (
                <button
                  type="button"
                  onClick={() => advanced.setSection("englishTest", [])}
                  className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear test"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={9}
                step={0.5}
                className="h-8 w-16 text-sm"
                placeholder="Min"
                value={advanced.filters.englishScoreMin?.[0] ?? ""}
                onChange={(e) =>
                  advanced.setSection("englishScoreMin", e.target.value ? [e.target.value] : [])
                }
              />
              {advanced.filters.englishScoreMin?.[0] && (
                <button
                  type="button"
                  onClick={() => advanced.setSection("englishScoreMin", [])}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear score"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Multi-select combobox with chips for string arrays (institutions, study areas). */
function MultiCombobox({
  options,
  selected,
  onSelectedChange,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onSelectedChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const anchor = useComboboxAnchor();
  const [inputValue, setInputValue] = useState("");
  const filtered = inputValue
    ? options.filter((o) => o.toLowerCase().includes(inputValue.toLowerCase()))
    : options;
  return (
    <Combobox
      value={selected}
      onValueChange={(v) => {
        onSelectedChange(v);
        setInputValue("");
      }}
      multiple
    >
      <ComboboxChips ref={anchor}>
        {selected.map((v) => (
          <ComboboxChip key={v}>{v}</ComboboxChip>
        ))}
        <ComboboxChipsInput
          placeholder={selected.length === 0 ? placeholder : ""}
          className="min-w-[80px]"
          onChange={(e) => setInputValue(e.target.value)}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxList>
          <ComboboxEmpty>No results.</ComboboxEmpty>
          {filtered.map((o) => (
            <ComboboxItem key={o} value={o}>
              {o}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/** Country combobox with flag emoji in items and chips. */
function CountryCombobox({
  countries,
  selected,
  onSelectedChange,
}: {
  countries: Country[];
  selected: string[];
  onSelectedChange: (v: string[]) => void;
}) {
  const anchor = useComboboxAnchor();
  const [inputValue, setInputValue] = useState("");

  const nameToCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of countries) map.set(c.name, c.code);
    return map;
  }, [countries]);

  const filtered = inputValue
    ? countries.filter((c) => c.name.toLowerCase().includes(inputValue.toLowerCase()))
    : countries;

  return (
    <Combobox
      value={selected}
      onValueChange={(v) => {
        onSelectedChange(v);
        setInputValue("");
      }}
      multiple
    >
      <ComboboxChips ref={anchor}>
        {selected.map((name) => {
          const code = nameToCode.get(name);
          return (
            <ComboboxChip key={name}>
              {code ? (
                <>
                  <span aria-hidden>{countryFlag(code)}</span> {name}
                </>
              ) : (
                name
              )}
            </ComboboxChip>
          );
        })}
        <ComboboxChipsInput
          placeholder={selected.length === 0 ? "Search countries…" : ""}
          className="min-w-[80px]"
          onChange={(e) => setInputValue(e.target.value)}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxList>
          <ComboboxEmpty>No results.</ComboboxEmpty>
          {filtered.map((c) => (
            <ComboboxItem key={c.code} value={c.name}>
              <span aria-hidden>{countryFlag(c.code)}</span>
              {c.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function FilterField({
  label,
  className,
  children,
  onClear,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
  onClear?: () => void;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex h-4 items-center justify-between gap-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-0.5 text-[0.6875rem] text-muted-foreground/70 transition-colors hover:text-foreground"
            aria-label={`Clear ${label} filter`}
          >
            <XIcon className="size-2.5" />
            <span>clear</span>
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
