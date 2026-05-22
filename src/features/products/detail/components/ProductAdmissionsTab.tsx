import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@shared/components/ui/Accordion";
import { FilterDropdown, type FilterDropdownOption } from "@shared/lib/data-table";
import {
  BookOpenIcon,
  CalendarIcon,
  ClipboardListIcon,
  ClockIcon,
  GlobeIcon,
  GraduationCapIcon,
  InfoIcon,
  MapPinIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { englishExamScores, formatPartialDate, toArray } from "../../lib/product-format";
import type {
  CountrySpecificRequirement,
  ExamSpecificRequirement,
  IntakeEntry,
  Product,
  StandardizedTestRequirement,
} from "../../types/product.types";
import { DetailCard } from "./DetailCard";

interface ProductAdmissionsTabProps {
  product: Product;
}

/**
 * Admissions tab — up to six cards. Each conditional on the presence of
 * its backing v19 field:
 *   1. Academic requirements (generic + country-specific routes)
 *   2. Prerequisites (work experience + education gap + foundational pathways)
 *   3. English language requirements (array of `{test_name, scores}`)
 *   4. Standardized tests (GRE / GMAT / SAT / LSAT…)
 *   5. Upcoming intakes (from `intakes[]`)
 *   6. Admission requirements notes (free-text override)
 */
export function ProductAdmissionsTab({ product }: ProductAdmissionsTabProps) {
  const reqs = product.admissions_requirements;
  const academic = reqs?.academic_requirements;
  const exams = englishExamScores(product);
  const standardized = toArray<StandardizedTestRequirement>(reqs?.standardized_test_requirements);
  const intakes = toArray<IntakeEntry>(reqs?.intakes);
  const intakeNotes = reqs?.intake_notes;
  const admissionNotes = reqs?.admission_requirements_notes;
  const foundational = reqs?.foundational_pathways;
  const workExp = reqs?.work_experience_requirements;
  const gap = reqs?.education_gap_requirements;

  const countryRoutes = toArray<CountrySpecificRequirement>(
    academic?.country_specific_requirements,
  );
  const hasAcademic = Boolean(academic?.generic_requirements) || countryRoutes.length > 0;
  const hasPrereqs = Boolean(foundational || workExp || gap);
  const hasAnyData =
    hasAcademic ||
    hasPrereqs ||
    exams.length > 0 ||
    standardized.length > 0 ||
    intakes.length > 0 ||
    Boolean(admissionNotes);

  // Single-select exam picker. Falls back to the first exam if the stored
  // selection isn't in the list (e.g. user deselected, or the product's
  // exam mix changed). `examOptions` feeds the FilterDropdown.
  const examOptions = useMemo<FilterDropdownOption[]>(
    () =>
      exams
        .filter((e): e is { test_name: string; scores?: Record<string, string> } =>
          Boolean(e.test_name),
        )
        .map((e) => ({ value: e.test_name, label: e.test_name })),
    [exams],
  );
  const firstExamName = exams[0]?.test_name ?? "";
  const [activeExam, setActiveExam] = useState<string>(firstExamName);
  const selectedExam = exams.find((e) => e.test_name === (activeExam || firstExamName)) ?? exams[0];

  return (
    <div className="space-y-4">
      {hasAcademic && academic && <AcademicRequirementsCard academic={academic} />}

      {hasPrereqs && (
        <DetailCard title="Prerequisites & pathways" icon={BookOpenIcon}>
          <dl className="grid gap-4">
            {foundational && <PrereqRow label="Foundational pathways" value={foundational} />}
            {workExp && <PrereqRow label="Work experience required" value={workExp} />}
            {gap && <PrereqRow label="Education gap policy" value={gap} />}
          </dl>
        </DetailCard>
      )}

      {exams.length > 0 && selectedExam && (
        <DetailCard
          title="English language requirements"
          icon={GlobeIcon}
          subtitle={`${exams.length} test${exams.length === 1 ? "" : "s"}`}
          action={
            exams.length > 1 ? (
              <FilterDropdown
                label="Exam"
                icon={<GlobeIcon className="size-3.5" />}
                options={examOptions}
                selected={selectedExam.test_name ? [selectedExam.test_name] : []}
                onSelectedChange={(values) => setActiveExam(values[0] ?? firstExamName)}
                multiple={false}
                searchable={exams.length > 6}
                searchPlaceholder="Search exams..."
              />
            ) : null
          }
        >
          <ScoreGrid testName={selectedExam.test_name ?? ""} scores={selectedExam.scores ?? {}} />
        </DetailCard>
      )}

      {standardized.length > 0 && (
        <DetailCard
          title="Standardized tests"
          icon={ClipboardListIcon}
          subtitle={`${standardized.length} test${standardized.length === 1 ? "" : "s"}`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {standardized.map((t, i) => (
              <div key={i} className="rounded-md border border-border-subtle bg-background p-3.5">
                <div className="mb-2 text-[0.8125rem] font-medium">{t.test_name ?? "—"}</div>
                {t.scores && Object.keys(t.scores).length > 0 ? (
                  <dl className="grid gap-1.5">
                    {Object.entries(t.scores).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 text-xs">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="font-mono text-foreground">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="text-xs italic text-muted-foreground">No score breakdown.</div>
                )}
              </div>
            ))}
          </div>
        </DetailCard>
      )}

      {intakes.length > 0 && (
        <DetailCard
          title="Upcoming intakes"
          icon={CalendarIcon}
          subtitle={`${intakes.length} scheduled`}
        >
          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            {intakes.map((intake, i) => {
              const start = formatPartialDate(intake.course_start_date);
              const deadline = formatPartialDate(intake.application_deadlines);
              return (
                <div
                  key={i}
                  className="flex flex-col gap-2 rounded-md border border-border-subtle bg-background p-3.5"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
                    <CalendarIcon className="size-3" />
                    Start
                  </div>
                  <div className="text-lg font-semibold tracking-[-0.01em]">
                    {start ?? intake.course_start_date ?? "—"}
                  </div>
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {deadline && (
                      <span>
                        Apply by <b className="font-medium text-foreground">{deadline}</b>
                      </span>
                    )}
                    {intake.campus && (
                      <span>
                        Campus <b className="font-medium text-foreground">{intake.campus}</b>
                      </span>
                    )}
                    {intake.delivery_mode && (
                      <span>
                        Delivery{" "}
                        <b className="font-medium text-foreground">{intake.delivery_mode}</b>
                      </span>
                    )}
                    {intake.study_mode && (
                      <span>
                        Mode <b className="font-medium text-foreground">{intake.study_mode}</b>
                      </span>
                    )}
                    {intake.study_option && (
                      <span>
                        Option <b className="font-medium text-foreground">{intake.study_option}</b>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {intakeNotes && (
            <div className="mt-4 flex gap-2.5 rounded-md border border-border-subtle bg-muted p-3.5 text-[0.8125rem] leading-normal text-muted-foreground">
              <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
              <span>{intakeNotes}</span>
            </div>
          )}
        </DetailCard>
      )}

      {admissionNotes && (
        <DetailCard title="Admission notes" icon={InfoIcon}>
          <p className="text-[0.8125rem] leading-[1.6] text-foreground text-pretty whitespace-pre-wrap">
            {admissionNotes}
          </p>
        </DetailCard>
      )}

      {!hasAnyData && (
        <DetailCard title="Admissions" icon={GraduationCapIcon}>
          <p className="text-sm italic text-muted-foreground">
            No admissions requirements on file for this course yet.
          </p>
        </DetailCard>
      )}
    </div>
  );
}

// ---- Academic requirements ----

function AcademicRequirementsCard({
  academic,
}: {
  academic: NonNullable<Product["admissions_requirements"]>["academic_requirements"];
}) {
  const countryRoutes = toArray<CountrySpecificRequirement>(
    academic?.country_specific_requirements,
  );

  // Stable lookup so the combobox + selected-route renderers don't
  // re-scan the route array on every render. Keyed by the same value the
  // FilterDropdown options use (country_code ∪ fallback index).
  const routeByKey = useMemo(() => {
    const map = new Map<string, CountrySpecificRequirement>();
    countryRoutes.forEach((route, i) => {
      map.set(route.country_code ?? `idx-${i}`, route);
    });
    return map;
  }, [countryRoutes]);

  const options = useMemo<FilterDropdownOption[]>(
    () =>
      countryRoutes.map((route, i) => {
        const value = route.country_code ?? `idx-${i}`;
        const name = route.country_name ?? route.country_code ?? `Country ${i + 1}`;
        return { value, label: route.country_code ? `${name} (${route.country_code})` : name };
      }),
    [countryRoutes],
  );

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const selectedRoutes = selectedKeys
    .map((k) => routeByKey.get(k))
    .filter((r): r is CountrySpecificRequirement => Boolean(r));

  return (
    <DetailCard
      title="Academic requirements"
      icon={GraduationCapIcon}
      subtitle={
        countryRoutes.length > 0
          ? `${countryRoutes.length} country route${countryRoutes.length === 1 ? "" : "s"}`
          : undefined
      }
      action={
        countryRoutes.length > 0 ? (
          <FilterDropdown
            label="Filter by country"
            icon={<MapPinIcon className="size-3.5" />}
            options={options}
            selected={selectedKeys}
            onSelectedChange={setSelectedKeys}
            searchable
            searchPlaceholder="Search countries..."
          />
        ) : null
      }
    >
      {academic?.generic_requirements && (
        <p className="text-sm leading-[1.6] text-foreground text-pretty whitespace-pre-wrap">
          {academic.generic_requirements}
        </p>
      )}
      {countryRoutes.length > 0 && (
        <>
          {academic?.generic_requirements && <div className="my-4 h-px bg-border-subtle" />}
          {selectedRoutes.length === 0 ? (
            <div className="rounded-md border border-dashed border-border-subtle bg-muted/40 px-4 py-6 text-center text-[0.8125rem] text-muted-foreground">
              Select one or more countries to see their admission routes.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {selectedRoutes.map((route, i) => (
                <CountryRouteCard key={route.country_code ?? `idx-${i}`} route={route} />
              ))}
            </div>
          )}
        </>
      )}
    </DetailCard>
  );
}

function CountryRouteCard({ route }: { route: CountrySpecificRequirement }) {
  const exams = toArray<ExamSpecificRequirement>(route.exam_specific_requirements);
  const label = route.country_name ?? route.country_code ?? "Country";
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border-subtle bg-background p-4">
      <div className="flex items-center gap-2">
        {route.country_code && (
          <span className="inline-flex h-[20px] items-center rounded bg-muted px-1.5 font-mono text-[0.6875rem] text-muted-foreground">
            {route.country_code}
          </span>
        )}
        <span className="text-[0.8125rem] font-medium">{label}</span>
      </div>
      {route.generic_requirements && (
        <p className="text-[0.8125rem] leading-[1.6] text-foreground text-pretty whitespace-pre-wrap">
          {route.generic_requirements}
        </p>
      )}
      {exams.length > 0 && (
        <Accordion type="single" collapsible defaultValue="exams">
          <AccordionItem value="exams" className="rounded border border-border-subtle">
            <AccordionTrigger className="px-3 py-2 text-xs font-medium">
              Exam-specific requirements ({exams.length})
            </AccordionTrigger>
            <AccordionContent className="space-y-2 border-t border-border-subtle px-3 pt-2.5 pb-3">
              {exams.map((ex, j) => (
                <div
                  key={j}
                  className="flex flex-col gap-0.5 rounded border border-border-subtle bg-card p-2.5"
                >
                  <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                    {ex.exam_name ?? "Exam"}
                  </span>
                  <span className="text-[0.8125rem] text-foreground">{ex.requirements ?? "—"}</span>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}

// ---- Score grid for English language requirements ----

interface ScoreGridProps {
  testName: string;
  scores: Record<string, string>;
}

function ScoreGrid({ testName, scores }: ScoreGridProps) {
  const entries = Object.entries(scores);
  const overall = scores.Overall ?? scores.overall;
  const rest = entries.filter(([k]) => k !== "Overall" && k !== "overall");

  return (
    <>
      {overall && (
        <div className="mb-4 flex items-baseline gap-4">
          <div>
            <div className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Minimum overall — {testName}
            </div>
            <div className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.02em]">
              {overall}
            </div>
          </div>
          <p className="max-w-[280px] text-xs text-muted-foreground text-pretty">
            Sub-scores below are per-skill minimums; no skill may fall below them.
          </p>
        </div>
      )}
      {rest.length > 0 && (
        <div className="grid gap-px overflow-hidden rounded-md border border-border-subtle bg-border-subtle sm:grid-cols-2">
          {rest.map(([skill, value]) => (
            <div key={skill} className="flex min-h-[88px] flex-col gap-1 bg-card px-4 py-3.5">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                {skill}
              </span>
              <span className="text-[1.375rem] font-semibold tracking-[-0.02em]">{value}</span>
              <span className="text-[0.6875rem] text-muted-foreground">
                <span className="font-mono">min band</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ---- Prereq row helper ----

function PrereqRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        <ClockIcon className="size-3" />
        {label}
      </dt>
      <dd className="m-0 whitespace-pre-wrap text-[0.8125rem] leading-[1.6] text-foreground">
        {value}
      </dd>
    </div>
  );
}

// ---- Static admission checklist ----
