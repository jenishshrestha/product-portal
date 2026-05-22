import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@shared/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/Dialog";
import { Form } from "@shared/components/ui/Form";
import { useEffect, useId, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type ProductFormValues,
  productFormDefaults,
  productFormSchema,
} from "../lib/product.schema";
import type { Product } from "../types/product.types";
import { ProductFormBody } from "./ProductForm";

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Product | null;
}

/**
 * Best-effort map from the backend's v19.0.0 nested `Product` to the flat
 * form values used by the legacy (PRD-shaped) form. Fields that don't have
 * a clean v19 path (code, branches[].name, entryRequirements[], intakes[])
 * fall back to defaults — full round-trip is on the API-integration pass.
 */
const DURATION_UNITS_LOWER: readonly string[] = ["Years", "Months", "Weeks"];

function normalizeUnit(raw: string | null | undefined): "Years" | "Months" | "Weeks" {
  if (!raw) {
    return "Years";
  }
  const match = DURATION_UNITS_LOWER.find((u) => u.toLowerCase() === raw.toLowerCase());
  return (match as "Years" | "Months" | "Weeks") ?? "Years";
}

function toFormValues(product: Product): ProductFormValues {
  const defaults = productFormDefaults();
  const primaryLocation = product.institution_details?.institution_locations?.[0];
  const primaryFee = product.fees_and_funding?.fees?.[0];

  const rawStudyLevel = product.course_details?.course_level?.study_level ?? "";
  const studyLevel =
    (defaults.studyLevel
      ? (["undergraduate", "postgraduate", "certificate", "diploma"] as const).find(
          (l) => l === rawStudyLevel.toLowerCase(),
        )
      : undefined) ?? defaults.studyLevel;

  const courseDurations = (product.course_details?.course_durations ?? []).map((d) => ({
    id: crypto.randomUUID(),
    value: d.value ?? 0,
    unit: normalizeUnit(d.unit),
    studyMode: d.study_mode ?? undefined,
    studyOption: d.study_option ?? undefined,
    // v19 `locations` on a duration is a single string in the sample payload.
    locations: typeof d.locations === "string" ? d.locations : undefined,
  }));

  const deliveryModes = (product.course_details?.delivery_modes ?? []).map((m) => ({
    id: crypto.randomUUID(),
    deliveryMode: m.delivery_mode ?? "",
    // v19 `locations` on a delivery mode is a string[]. Flatten for the
    // single-input row; split back on save.
    locations: Array.isArray(m.locations) ? m.locations.join(", ") : (m.locations ?? undefined),
  }));

  const rawIntl = product.course_details?.available_for_international_students;
  const acceptsInternational = rawIntl === "Yes" || rawIntl === "No" ? rawIntl : undefined;

  return {
    ...defaults,
    name: product.course_details?.course_name ?? "",
    institution: product.institution_details?.institution_name ?? "",
    country: primaryLocation?.country ?? "",
    studyAreas: product.course_details?.study_areas ?? [],
    studyLevel,
    qualification: product.course_details?.course_level?.qualification_type ?? "",
    acceptsInternational,
    courseDurations,
    deliveryModes,
    deliveryNotes: product.course_details?.delivery_notes ?? "",
    fees: primaryFee?.value,
    currency:
      (["USD", "NZD", "AUD", "GBP"] as const).find((c) => c === primaryFee?.currency) ??
      defaults.currency,
    description: product.course_details?.course_overview ?? "",
    status: product.status,
  };
}

/**
 * Add / Edit Product modal — UI restored verbatim from the starter, with
 * API integration intentionally disabled for this pass (per user request).
 * Submit logs the flat form values + toasts; create / update hooks get
 * re-wired in the next integration pass, mapping the flat shape to the
 * nested `ProductCreateInput` payload.
 */
export function ProductFormModal({ open, onOpenChange, initialData }: ProductFormModalProps) {
  const isEdit = Boolean(initialData);
  const formId = useId();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productFormDefaults(),
    mode: "onBlur",
  });

  const existingBranchIds = useMemo(
    () => new Set<string>(),
    // v19 doesn't carry legacy branch ids; keep the prop for the editor's
    // read-only-name rule but start empty for every Edit session.
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    form.reset(initialData ? toFormValues(initialData) : productFormDefaults());
  }, [open, initialData, form]);

  function onSubmit(values: ProductFormValues) {
    if (import.meta.env.DEV) {
      console.log("[product form] submit (API integration pending):", values);
    }
    toast.info(
      isEdit
        ? "Form captured — API update wiring comes next."
        : "Form captured — API create wiring comes next.",
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update course details, branches, and entry requirements."
              : "Create a new course with branches, intakes, and entry requirements."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
              <ProductFormBody existingBranchIds={existingBranchIds} />
            </form>
          </Form>
        </div>

        <DialogFooter className="flex-row justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            {isEdit ? "Save Product" : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
