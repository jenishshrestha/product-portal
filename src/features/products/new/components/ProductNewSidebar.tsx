import { cn } from "@shared/lib/utils";
import { CheckIcon, HashIcon, MapPinIcon, MinusIcon } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { InstitutionLogo } from "../../components/InstitutionLogo";
import { DetailCard } from "../../detail/components/DetailCard";
import type { ProductFormValues } from "../../lib/product.schema";
import { STUDY_LEVEL_LABELS } from "../../lib/product-format";

const BADGE_SUCCESS =
  "inline-flex h-[22px] items-center gap-[5px] rounded-[4px] border border-transparent bg-success-soft px-2 text-xs font-medium leading-[1.5] text-success-strong";
const BADGE_MUTED =
  "inline-flex h-[22px] items-center gap-[5px] rounded-[4px] border border-border px-2 text-xs font-medium leading-[1.5] text-muted-foreground";

function InternationalBadge({ value }: { value: "Yes" | "No" | undefined }) {
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

function FallbackDash() {
  return <span className="text-muted-foreground">—</span>;
}

/**
 * Live-preview sidebar mirroring `ProductDetailSidebar`. Reads form values
 * via `useWatch` so each KV row updates in place while the user fills in
 * the corresponding field on the main form area. This is a **summary** —
 * every field shown here has its editor on the main canvas. Inputs don't
 * belong here so the sidebar stays glanceable.
 */
export function ProductNewSidebar() {
  const form = useFormContext<ProductFormValues>();
  const values = useWatch({ control: form.control });

  const institution = values.institution?.trim();
  const country = values.country?.trim();
  const studyLevel = values.studyLevel ? STUDY_LEVEL_LABELS[values.studyLevel] : undefined;
  const qualification = values.qualification?.trim();
  const acceptsIntl = values.acceptsInternational;
  const code = values.code?.trim();

  const durations = values.courseDurations ?? [];
  const firstDuration = durations[0];
  const durationLabel = firstDuration
    ? [
        firstDuration.value ? `${firstDuration.value} ${firstDuration.unit ?? ""}`.trim() : null,
        firstDuration.studyMode,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  const feeAmount = typeof values.fees === "number" && values.fees > 0 ? values.fees : undefined;
  const currency = values.currency;
  const intakes = values.intakes ?? [];
  const nextIntake = intakes[0];

  const tuitionLabel = feeAmount
    ? `${feeAmount.toLocaleString()} ${currency ?? ""}`.trim()
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <InstitutionLogo name={institution} size="lg" />
            <div className="min-w-0">
              <div
                className={cn(
                  "mb-0.5 truncate text-sm font-medium",
                  !institution && "italic text-muted-foreground",
                )}
              >
                {institution || "Institution —"}
              </div>
              {country && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPinIcon className="size-3" />
                  <span className="truncate">{country}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <DetailCard title="Quick facts" icon={HashIcon} dense>
        <dl className="grid gap-3">
          <KvRow label="Country">{country || <FallbackDash />}</KvRow>
          <KvRow label="Study level">{studyLevel || <FallbackDash />}</KvRow>
          <KvRow label="Qualification" valueClassName="text-xs">
            {qualification || <FallbackDash />}
          </KvRow>
          <KvRow label="Duration">{durationLabel || <FallbackDash />}</KvRow>
          <KvRow label="Next intake">{nextIntake || <FallbackDash />}</KvRow>
          <KvRow label="Tuition">{tuitionLabel || <FallbackDash />}</KvRow>
          <KvRow label="Accepts intl.">
            <InternationalBadge value={acceptsIntl} />
          </KvRow>
        </dl>
      </DetailCard>

      {code && (
        <DetailCard title="Course code" icon={HashIcon} dense>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.04em] text-muted-foreground">
              Code
            </span>
            <span className="rounded border border-border-subtle bg-muted px-2 py-0.5 font-mono text-[0.78125rem] font-medium">
              {code}
            </span>
          </div>
        </DetailCard>
      )}
    </div>
  );
}
