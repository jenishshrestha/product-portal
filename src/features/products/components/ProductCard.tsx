import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/DropdownMenu";
import { usePermissions } from "@shared/hooks";
import { Link } from "@tanstack/react-router";
import { CopyIcon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { useProductActions } from "../lib/product-actions-context";
import {
  nextIntake,
  primaryCity,
  primaryCourseCode,
  primaryCourseName,
  primaryDeliveryModes,
  primaryDuration,
  primaryDurationMode,
  primaryInstitution,
  primaryQualification,
  primaryTuition,
  updatedAgo,
} from "../lib/product-format";
import type { Product, ProductStatus } from "../types/product.types";
import { InstitutionLogo } from "./InstitutionLogo";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}

const STATUS_DOT: Record<ProductStatus, string> = {
  published: "bg-success shadow-[0_0_0_3px] shadow-success/20",
  pending_review: "bg-warning shadow-[0_0_0_3px] shadow-warning/20",
  archived: "bg-muted-foreground/50",
};

/**
 * Course card — matches Claude Design `.course-card` at pixel parity:
 * - 10px radius, flex column, card bg, primary-tinted hover border
 * - Header row: logo · institution sub with status dot · title (2-line clamp) · code · city
 * - 2×2 stats grid: Duration / Qualification / Tuition (intl.) / Delivery
 * - Footer: next-intake pill + "Xd ago" timestamp
 *
 * Hover More button (admin-only) fades in top-right with Duplicate + Delete.
 * Whole card is a Link to the detail page; menu items stop propagation so
 * they don't trigger the navigate.
 */
export function ProductCard({ product, isSelected }: ProductCardProps) {
  const institution = primaryInstitution(product);
  const code = primaryCourseCode(product);
  const city = primaryCity(product);
  const duration = primaryDuration(product);
  const durationMode = primaryDurationMode(product);
  const qualification = primaryQualification(product);
  const tuition = primaryTuition(product);
  const delivery = primaryDeliveryModes(product);
  const intake = nextIntake(product);
  const updated = updatedAgo(product);
  const studyAreas = Array.isArray(product.course_details?.study_areas)
    ? product.course_details.study_areas
    : [];
  const { onDelete, onDuplicate } = useProductActions();
  const { canDelete, isSuperadmin } = usePermissions();

  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      data-selected={isSelected ? "" : undefined}
      className="group relative flex flex-col overflow-hidden rounded-[10px] border border-border bg-card transition-colors hover:border-primary/50 data-selected:border-primary"
    >
      {/* Hover actions — card body is a Link to the detail page, so Edit
          lives on the detail page itself. Only Duplicate + Delete here. */}
      {(isSuperadmin || canDelete) && (
        <div className="pointer-events-none absolute top-3 right-3 z-10 opacity-0 translate-x-1 transition-all duration-100 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More"
                className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <MoreHorizontalIcon className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(event) => event.stopPropagation()}
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              {isSuperadmin && (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    onDuplicate(product);
                  }}
                >
                  <CopyIcon className="size-3.5" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(event) => {
                    event.preventDefault();
                    onDelete(product);
                  }}
                >
                  <TrashIcon className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 border-b border-border-subtle p-4 pr-12">
        <InstitutionLogo name={institution} size="md" />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              aria-hidden
              className={`inline-block size-1.5 shrink-0 rounded-full ${STATUS_DOT[product.status]}`}
            />
            <span className="truncate">{institution}</span>
          </div>
          <h3 className="mb-1 line-clamp-2 text-[0.9375rem] font-semibold leading-[1.3] tracking-[-0.01em] text-foreground text-balance">
            {primaryCourseName(product)}
          </h3>
          {(code || city) && (
            <div className="truncate font-mono text-[0.6875rem] text-muted-foreground">
              {code}
              {code && city && <span className="mx-1">·</span>}
              {city}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-3 px-4 py-3.5">
        <Stat
          label="Duration"
          value={duration}
          sub={durationMode ? `/ ${durationMode}` : undefined}
        />
        <Stat label="Qualification" value={qualification} />
        <Stat
          label="Tuition (intl.)"
          valueClassName="font-mono tracking-[-0.01em] text-[0.78125rem]"
          value={tuition?.amount ?? "—"}
          sub={tuition?.currency ? `${tuition.currency}/yr` : undefined}
        />
        <Stat label="Delivery" value={delivery ?? "—"} />
      </div>

      {/* Study areas chips */}
      {studyAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3.5">
          {studyAreas.map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-background px-2.5 py-[5px] text-[0.78125rem] font-medium text-foreground"
            >
              <span className="truncate max-w-[180px]">{area}</span>
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-border-subtle bg-card/70 px-4 py-3 text-xs text-muted-foreground">
        <IntakePill status={product.status} intake={intake} />
        <span className="font-mono text-[0.6875rem]">{updated}</span>
      </div>
    </Link>
  );
}

interface StatProps {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}

function Stat({ label, value, sub, valueClassName }: StatProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[0.65625rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <span className="flex min-w-0 items-baseline gap-1.5 truncate text-[0.8125rem] font-medium text-foreground">
        <span className={valueClassName}>{value}</span>
        {sub && <span className="text-[0.6875rem] font-normal text-muted-foreground">{sub}</span>}
      </span>
    </div>
  );
}

interface IntakePillProps {
  status: ProductStatus;
  intake: string | undefined;
}

function IntakePill({ status, intake }: IntakePillProps) {
  if (status === "archived") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.71875rem] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden />
        No active intake
      </span>
    );
  }
  if (!intake) {
    return <span aria-hidden />;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.71875rem] font-medium text-foreground">
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      Next intake · {intake}
    </span>
  );
}
