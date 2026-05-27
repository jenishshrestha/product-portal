import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/DropdownMenu";
import { usePermissions } from "@shared/hooks";
import { cn, safeExternalUrl } from "@shared/lib/utils";
import {
  CopyIcon,
  ExternalLinkIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { memo } from "react";
import { useProductActions } from "../../lib/product-actions-context";
import {
  primaryCourseCode,
  primaryCourseName,
  primaryInstitution,
  primaryLocation,
  primaryQualification,
  primaryStudyLevel,
} from "../../lib/product-format";
import type { Product } from "../../types/product.types";

interface ProductDetailHeaderProps {
  product: Product;
}

// Shared visual shape for header action pills. `cursor-pointer` lives on
// the interactive variants only — the status pill is a `<span>` and should
// not imply it is clickable.
const ACTION_BASE =
  "inline-flex h-[34px] items-center justify-center gap-1.5 rounded-md border px-3.5 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 whitespace-nowrap";

const ACTION_OUTLINE = cn(
  ACTION_BASE,
  "cursor-pointer border-border bg-card text-foreground hover:bg-muted",
);

const ACTION_PRIMARY = cn(ACTION_BASE, "border-primary bg-primary text-primary-foreground");

const STATUS_LABEL: Record<Product["status"], string> = {
  published: "Published",
  pending_review: "Pending review",
  archived: "Archived",
};

/**
 * Claude Design `.page-header`: flex row with content (meta eyebrow, h1,
 * description line) on the left and action cluster on the right. The meta
 * eyebrow reads "Course · {study_level} · {qualification_type}" in uppercase
 * 12px muted type. Description line reuses primaryInstitution / location /
 * primaryCourseCode.
 *
 * Memoized so tab-switches on `ProductDetailPage` don't re-render the
 * header. Only re-renders when `product` reference changes (new detail
 * load) or when `useProductActions`/`usePermissions` context values change.
 */
export const ProductDetailHeader = memo(function ProductDetailHeader({
  product,
}: ProductDetailHeaderProps) {
  const { isSuperadmin, canDelete } = usePermissions();
  const { onEdit, onDelete, onDuplicate } = useProductActions();

  const studyLevel = primaryStudyLevel(product);
  const qualification = primaryQualification(product);
  const institution = primaryInstitution(product);
  const location = primaryLocation(product);
  const code = primaryCourseCode(product);
  const publicUrl = safeExternalUrl(product.course_details?.course_url);

  return (
    <header className="mb-4 flex items-start justify-between gap-8">
      <div className="min-w-0 flex-1">
        <div className="mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.02em] text-muted-foreground">
          <span>Course</span>
          {studyLevel && studyLevel !== "—" && (
            <>
              <span className="size-[3px] rounded-full bg-current opacity-50" aria-hidden />
              <span>{studyLevel}</span>
            </>
          )}
          {qualification && qualification !== "—" && (
            <>
              <span className="size-[3px] rounded-full bg-current opacity-50" aria-hidden />
              <span>{qualification}</span>
            </>
          )}
        </div>
        <h1 className="mb-1.5 text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground">
          {primaryCourseName(product)}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{institution}</span>
          {location && location !== "—" && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-3.5" />
                {location}
              </span>
            </>
          )}
          {code && (
            <>
              <span className="opacity-40">·</span>
              <span className="font-mono">{code}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {publicUrl && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={ACTION_OUTLINE}>
            <ExternalLinkIcon className="size-3.5" />
            View Course page
          </a>
        )}
        {isSuperadmin && (
          <button type="button" className={ACTION_OUTLINE} onClick={() => onEdit(product)}>
            <PencilIcon className="size-3.5" />
            Edit
          </button>
        )}
        {(isSuperadmin || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More actions"
                className={cn(ACTION_OUTLINE, "h-[34px] w-[34px] px-0")}
              >
                <MoreHorizontalIcon className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isSuperadmin && (
                <DropdownMenuItem onSelect={() => onDuplicate(product)}>
                  <CopyIcon className="size-3.5" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem variant="destructive" onSelect={() => onDelete(product)}>
                  <TrashIcon className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <span role="status" className={ACTION_PRIMARY}>
          {STATUS_LABEL[product.status]}
        </span>
      </div>
    </header>
  );
});
