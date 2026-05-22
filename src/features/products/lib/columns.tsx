import type { DataTableColumnDef } from "@shared/lib/data-table";
import { DataTableColumnHeader } from "@shared/lib/data-table";
import { InstitutionLogo } from "../components/InstitutionLogo";
import { ProductRowActions } from "../components/ProductRowActions";
import { ProductStatusCell } from "../components/ProductStatusCell";
import type { Product } from "../types/product.types";
// Backend's `sortBy` accepts only the 4 ids below (per OpenAPI enum).
// Columns whose id isn't in that list have `enableSorting: false` so the
// header renders as static text — clicking is a no-op. Sort UX for those
// dimensions lives in ProductResultsBar (which only exposes allowed ids).
import {
  primaryCourseCode,
  primaryCourseName,
  primaryDuration,
  primaryDurationMode,
  primaryInstitution,
  primaryLocation,
  primaryQualification,
  primaryTuition,
  updatedAgo,
} from "./product-format";

/**
 * Column set mirrors the Claude Design catalog table view:
 * Course · Qualification · Duration · Location · Tuition (intl.) · Status · Updated.
 * Non-design "actions" column trails the Updated column for Edit / Delete —
 * removed when a row-detail-page pattern replaces per-row mutation.
 */
export const productColumns: DataTableColumnDef<Product>[] = [
  {
    id: "course_details.course_name",
    accessorFn: primaryCourseName,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Course" />,
    cell: ({ row }) => {
      const institution = primaryInstitution(row.original);
      const code = primaryCourseCode(row.original);
      return (
        <div className="flex min-w-0 items-center gap-2.5">
          <InstitutionLogo name={institution} size="sm" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[0.8125rem] font-medium text-foreground">
              {primaryCourseName(row.original)}
            </span>
            <span className="mt-px truncate text-[0.71875rem] text-muted-foreground">
              {code && <span className="font-mono text-foreground/80">{code}</span>}
              {code && <span className="mx-1.5">·</span>}
              {institution}
            </span>
          </div>
        </div>
      );
    },
    meta: { label: "Course" },
    size: 340,
  },
  {
    id: "course_details.course_level.qualification_type",
    accessorFn: primaryQualification,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Qualification" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{primaryQualification(row.original)}</span>
    ),
    enableSorting: false,
    meta: { label: "Qualification" },
    size: 180,
  },
  {
    id: "course_details.course_durations",
    accessorFn: primaryDuration,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
    cell: ({ row }) => {
      const duration = primaryDuration(row.original);
      const mode = primaryDurationMode(row.original);
      return (
        <span>
          {duration}
          {mode && <span className="text-muted-foreground"> / {mode}</span>}
        </span>
      );
    },
    enableSorting: false,
    meta: { label: "Duration" },
    size: 160,
  },
  {
    id: "institution_details.institution_locations",
    accessorFn: primaryLocation,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
    enableSorting: false,
    meta: { label: "Location" },
    size: 150,
  },
  {
    id: "fees_and_funding.fees",
    accessorFn: (product) => primaryTuition(product)?.amount ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tuition (intl.)" />,
    cell: ({ row }) => {
      const tuition = primaryTuition(row.original);
      if (!tuition) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <span>
          <span className="font-mono font-medium tracking-[-0.01em]">{tuition.amount}</span>
          {tuition.currency && (
            <span className="ml-1 font-mono text-[0.6875rem] text-muted-foreground">
              {tuition.currency}
            </span>
          )}
        </span>
      );
    },
    enableSorting: false,
    meta: { label: "Tuition (intl.)" },
    size: 140,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <ProductStatusCell product={row.original} />,
    enableSorting: false,
    meta: { label: "Status" },
    size: 140,
  },
  {
    accessorKey: "updatedAt",
    accessorFn: updatedAgo,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
    cell: ({ row }) => (
      <span className="font-mono text-[0.6875rem] text-muted-foreground">
        {updatedAgo(row.original)}
      </span>
    ),
    meta: { label: "Updated" },
    size: 100,
  },
  {
    id: "actions",
    cell: ({ row }) => <ProductRowActions product={row.original} />,
    enableSorting: false,
    enableHiding: false,
    size: 48,
  },
];
