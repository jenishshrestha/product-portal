import { AwardIcon, BookIcon, ClockIcon, InfoIcon, MapPinIcon, MonitorIcon } from "lucide-react";
import { formatLocations, toArray } from "../../lib/product-format";
import type {
  Accreditation,
  CourseDuration,
  DeliveryMode,
  InstitutionLocation,
  Product,
} from "../../types/product.types";
import { DetailCard } from "./DetailCard";

interface ProductOverviewTabProps {
  product: Product;
}

/**
 * Overview tab — five cards stacked vertically. Each card is conditional
 * on its data being present in the v19 payload:
 *   1. Course overview (prose + specializations/majors/minors/study-areas)
 *   2. Duration & study mode (rows from `course_durations[]`)
 *   3. Delivery modes (grid + optional `delivery_notes`)
 *   4. Campus locations (from `institution_locations[]`)
 *   5. Accreditations (just names per v19)
 */
export function ProductOverviewTab({ product }: ProductOverviewTabProps) {
  const overview = product.course_details?.course_overview;
  const majors = toArray<string>(product.course_details?.course_major);
  const minors = toArray<string>(product.course_details?.course_minor);
  const specializations = toArray<string>(product.course_details?.course_specialization);
  const studyAreas = toArray<string>(product.course_details?.study_areas);
  const durations = toArray<CourseDuration>(product.course_details?.course_durations);
  const deliveryModes = toArray<DeliveryMode>(product.course_details?.delivery_modes);
  const deliveryNotes = product.course_details?.delivery_notes;
  const locations = toArray<InstitutionLocation>(
    product.institution_details?.institution_locations,
  );
  const accreditations = toArray<Accreditation>(product.course_details?.accreditations);

  const hasChips = specializations.length + majors.length + minors.length + studyAreas.length > 0;

  return (
    <div className="space-y-4">
      <DetailCard title="Course overview" icon={BookIcon}>
        {overview ? (
          <p className="text-[0.9375rem] leading-[1.6] text-foreground text-pretty">{overview}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No overview on file.</p>
        )}
        {hasChips && (
          <>
            <div className="my-4 h-px bg-border-subtle" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {specializations.length > 0 && (
                <ChipGroup label="Specializations" items={specializations} accented />
              )}
              {majors.length > 0 && <ChipGroup label="Majors" items={majors} accented />}
              {minors.length > 0 && <ChipGroup label="Minors" items={minors} />}
              {studyAreas.length > 0 && (
                <ChipGroup label="Study areas" items={studyAreas.slice(0, 6)} />
              )}
            </div>
          </>
        )}
      </DetailCard>

      {durations.length > 0 && (
        <DetailCard title="Duration & study mode" icon={ClockIcon}>
          <div className="grid gap-0">
            {durations.map((d, i) => (
              <div
                key={i}
                className="flex items-baseline gap-3 border-b border-dashed border-border-subtle py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-[72px] text-base font-semibold tracking-[-0.01em]">
                  {d.value ?? "—"} {d.unit?.toLowerCase() ?? ""}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {d.study_mode && (
                    <span className="text-[0.8125rem] font-medium">{d.study_mode}</span>
                  )}
                  {d.study_option && (
                    <span className="text-xs text-muted-foreground">{d.study_option}</span>
                  )}
                  {formatLocations(d.locations) && (
                    <span className="text-xs text-muted-foreground">
                      {formatLocations(d.locations)}
                    </span>
                  )}
                </div>
                {i === 0 && (
                  <span className="ml-auto rounded bg-primary-soft px-2 py-0.5 text-[0.6875rem] font-medium text-primary-strong">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        </DetailCard>
      )}

      {deliveryModes.length > 0 && (
        <DetailCard title="Delivery modes" icon={MonitorIcon}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {deliveryModes.map((m, i) => (
              <div
                key={i}
                className="rounded-md border border-border bg-background p-3.5 transition-colors hover:border-primary/50"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-[0.8125rem] font-medium">{m.delivery_mode ?? "—"}</span>
                </div>
                {formatLocations(m.locations) && (
                  <div className="text-xs text-muted-foreground">
                    {formatLocations(m.locations)}
                  </div>
                )}
              </div>
            ))}
          </div>
          {deliveryNotes && (
            <div className="mt-4 flex gap-2.5 rounded-md border border-primary/20 bg-primary-soft p-3.5 text-[0.8125rem] leading-normal text-foreground">
              <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-primary-strong" />
              <span>{deliveryNotes}</span>
            </div>
          )}
        </DetailCard>
      )}

      {locations.length > 0 && (
        <DetailCard
          title="Campus locations"
          icon={MapPinIcon}
          subtitle={`${locations.length} ${locations.length === 1 ? "location" : "locations"}`}
        >
          <div className="flex flex-col gap-2.5">
            {locations.map((loc, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-md border border-border-subtle bg-background px-3 py-2.5 text-[0.8125rem]"
              >
                <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">
                    {loc.city ?? loc.state_name ?? loc.country ?? "—"}
                  </span>
                  {loc.country && loc.city && (
                    <span className="text-xs text-muted-foreground">{loc.country}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DetailCard>
      )}

      {accreditations.length > 0 && (
        <DetailCard title="Accreditations" icon={AwardIcon} subtitle={`${accreditations.length}`}>
          <ul className="flex flex-wrap gap-2">
            {accreditations.map((a, i) => (
              <li
                key={i}
                className="inline-flex items-center rounded-md border border-border-subtle bg-background px-3 py-1.5 text-[0.8125rem] font-medium"
              >
                {a.name ?? "—"}
              </li>
            ))}
          </ul>
        </DetailCard>
      )}
    </div>
  );
}

interface ChipGroupProps {
  label: string;
  items: string[];
  /** Use the accented primary-dot treatment instead of plain pills. */
  accented?: boolean;
}

function ChipGroup({ label, items, accented = false }: ChipGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s) =>
          accented ? (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-background px-2.5 py-[5px] text-[0.78125rem] font-medium text-foreground"
            >
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              {s}
            </span>
          ) : (
            <span
              key={s}
              className="inline-flex items-center rounded-full border border-border-subtle bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
            >
              {s}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
