import { cn, safeExternalUrl } from "@shared/lib/utils";
import {
  CheckIcon,
  ExternalLinkIcon,
  FlaskConicalIcon,
  HashIcon,
  MapPinIcon,
  MinusIcon,
  PlaneIcon,
} from "lucide-react";
import { memo } from "react";
import { InstitutionLogo } from "../../components/InstitutionLogo";
import {
  courseIdentifiersByType,
  nextIntake,
  primaryCity,
  primaryCountry,
  primaryFee,
  primaryInstitution,
  primaryQualification,
  primaryStudyLevel,
  toArray,
} from "../../lib/product-format";
import type { CourseDuration, InstitutionCode, Product } from "../../types/product.types";
import { DetailCard } from "./DetailCard";

interface ProductDetailSidebarProps {
  product: Product;
}

const BADGE_SUCCESS =
  "inline-flex h-[22px] items-center gap-[5px] rounded-[4px] border border-transparent bg-success-soft px-2 text-xs font-medium leading-[1.5] text-success-strong";
const BADGE_MUTED =
  "inline-flex h-[22px] items-center gap-[5px] rounded-[4px] border border-border px-2 text-xs font-medium leading-[1.5] text-muted-foreground";

interface KvRowProps {
  label: string;
  children: React.ReactNode;
  valueClassName?: string;
}

function KvRow({ label, children, valueClassName }: KvRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[0.8125rem] text-muted-foreground">{label}</dt>
      <dd className={cn("m-0 max-w-[60%] text-right text-[0.8125rem] font-medium", valueClassName)}>
        {children}
      </dd>
    </div>
  );
}

export const ProductDetailSidebar = memo(function ProductDetailSidebar({
  product,
}: ProductDetailSidebarProps) {
  const institution = primaryInstitution(product);
  const city = primaryCity(product);
  const country = primaryCountry(product);
  const website = safeExternalUrl(product.institution_details?.institution_website);
  const studyLevel = primaryStudyLevel(product);
  const qualification = primaryQualification(product);
  const courseDurations = toArray<CourseDuration>(product.course_details?.course_durations ?? []);
  const intake = nextIntake(product);
  const tuition = primaryFee(product);
  const tuitionFrequency = product.fees_and_funding?.fees?.[0]?.frequency ?? null;
  const acceptsIntl = product.course_details?.available_for_international_students;
  const discipline = product.course_details?.discipline_type;
  const pgwp = product.course_details?.pgwp_alignment;
  const courseCodes = courseIdentifiersByType(product);
  const courseCodeEntries = Object.entries(courseCodes);
  const instCodes = toArray<InstitutionCode>(
    product.institution_details?.institution_identifiers?.codes,
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <InstitutionLogo name={institution} size="lg" />
            <div className="min-w-0">
              <div className="mb-0.5 truncate text-sm font-medium">{institution}</div>
              {(city || country) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPinIcon className="size-3" />
                  <span className="truncate">{[city, country].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
          </div>
          {(website || discipline || pgwp === "Yes") && (
            <>
              <div className="my-4 h-px bg-border-subtle" />
              {(discipline || pgwp === "Yes") && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {discipline && (
                    <span className={BADGE_MUTED}>
                      <FlaskConicalIcon className="size-3" />
                      {discipline}
                    </span>
                  )}
                  {pgwp === "Yes" && (
                    <span className={BADGE_SUCCESS}>
                      <PlaneIcon className="size-3" />
                      PGWP eligible
                    </span>
                  )}
                </div>
              )}
              {website && (
                <dl className="grid gap-3">
                  <KvRow label="Website">
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary-strong hover:underline"
                    >
                      {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  </KvRow>
                </dl>
              )}
            </>
          )}
        </div>
      </section>

      <DetailCard title="Quick facts" icon={HashIcon} dense>
        <dl className="grid gap-3">
          <KvRow label="Country">{country !== "—" ? country : "—"}</KvRow>
          <KvRow label="Study level">{studyLevel !== "—" ? studyLevel : "—"}</KvRow>
          <KvRow label="Qualification" valueClassName="text-xs">
            {qualification !== "—" ? qualification : "—"}
          </KvRow>
          <KvRow label="Duration">
            {courseDurations.length === 0 ? (
              "—"
            ) : (
              <div className="flex flex-col gap-1 text-right">
                {courseDurations.map((d, i) => {
                  const dur = d.value && d.unit ? `${d.value} ${d.unit.toLowerCase()}` : null;
                  const label = dur
                    ? d.study_mode
                      ? `${dur} · ${d.study_mode}`
                      : dur
                    : (d.study_mode ?? "—");
                  return <span key={i}>{label}</span>;
                })}
              </div>
            )}
          </KvRow>
          {intake && <KvRow label="Next intake">{intake}</KvRow>}
          <KvRow label="Tuition">
            {tuitionFrequency ? `${tuition} · ${tuitionFrequency}` : tuition}
          </KvRow>
          <KvRow label="Accepts international students">
            <InternationalBadge value={acceptsIntl} />
          </KvRow>
        </dl>
      </DetailCard>

      {courseCodeEntries.length > 0 && (
        <DetailCard title="Course codes" icon={HashIcon} dense>
          <div className="grid gap-2.5 text-[0.8125rem]">
            {courseCodeEntries.map(([type, value]) => (
              <div key={type} className="flex items-center justify-between gap-3">
                <span className="text-[0.6875rem] font-medium uppercase tracking-[0.04em] text-muted-foreground">
                  {type}
                </span>
                <span className="rounded border border-border-subtle bg-muted px-2 py-0.5 font-mono text-[0.78125rem] font-medium">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </DetailCard>
      )}

      {instCodes.length > 0 && (
        <DetailCard title="Institution codes" icon={HashIcon} dense>
          <div className="grid gap-2.5 text-[0.8125rem]">
            {instCodes.map((code, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-[0.6875rem] font-medium uppercase tracking-[0.04em] text-muted-foreground">
                  {code.code_type ?? "—"}
                </span>
                <span className="rounded border border-border-subtle bg-muted px-2 py-0.5 font-mono text-[0.78125rem] font-medium">
                  {code.code_value ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </DetailCard>
      )}
    </div>
  );
});

function InternationalBadge({ value }: { value: "Yes" | "No" | null | undefined }) {
  if (value === "Yes") {
    return (
      <span className={BADGE_SUCCESS}>
        <CheckIcon className="size-2.5" />
        Yes
      </span>
    );
  }
  if (value === "No") {
    return (
      <span className={BADGE_MUTED}>
        <MinusIcon className="size-2.5" />
        No
      </span>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}
