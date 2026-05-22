import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@shared/components/ui/Button";
import { Form } from "@shared/components/ui/Form";
import { useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useId, useMemo } from "react";
import { useForm, useFormState } from "react-hook-form";
import { toast } from "sonner";
import { ProductDetailBackLink } from "../detail/components/ProductDetailBackLink";
import {
  type ProductFormValues,
  productFormDefaults,
  productFormSchema,
} from "../lib/product.schema";
import { ProductNewHeader } from "./components/ProductNewHeader";
import { ProductNewSidebar } from "./components/ProductNewSidebar";
import { ProductNewTabs } from "./components/ProductNewTabs";
import type { ProductNewTab } from "./types";

// Tab bodies are lazy so the initial Overview render doesn't pay for the
// Admissions / Fees chunks (Branch + EntryRequirement editors add up).
const ProductOverviewFormTab = lazy(() =>
  import("./components/ProductOverviewFormTab").then((m) => ({
    default: m.ProductOverviewFormTab,
  })),
);
const ProductAdmissionsFormTab = lazy(() =>
  import("./components/ProductAdmissionsFormTab").then((m) => ({
    default: m.ProductAdmissionsFormTab,
  })),
);
const ProductFeesFormTab = lazy(() =>
  import("./components/ProductFeesFormTab").then((m) => ({
    default: m.ProductFeesFormTab,
  })),
);

interface ProductNewPageProps {
  tab: ProductNewTab;
}

/**
 * New Course page. Mirrors the detail page layout (BackLink → Header →
 * StatusBar → 2-col grid) so the two screens feel like the same surface in
 * different modes. The right-hand sidebar live-previews form values, the
 * three tabs URL-sync via `?tab=` the same way the detail page does.
 *
 * Submit is still a placeholder — API wiring lands in a follow-up commit
 * along with the flat → nested v19 mapper.
 */
export function ProductNewPage({ tab }: ProductNewPageProps) {
  const navigate = useNavigate();
  const formId = useId();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productFormDefaults(),
    mode: "onBlur",
  });

  // Map RHF's error object back to the tab whose fields produced it. Lets
  // `ProductNewTabs` render a red chip on any tab the user can't currently
  // see — so a failed Save on a hidden tab isn't silently swallowed.
  //
  // `useFormState` subscribes to the `errors` slice (unlike reading
  // `form.formState.errors` directly, which doesn't trigger re-renders when
  // errors clear — leaving stale chip counts on the tabs).
  const { errors } = useFormState({ control: form.control });
  const errorCounts = useMemo(() => countErrorsByTab(errors), [errors]);

  function onSubmit(values: ProductFormValues) {
    if (import.meta.env.DEV) {
      console.log("[product new] submit (API integration pending):", values);
    }
    toast.info("Form captured — API create wiring comes next.");
    void navigate({ to: "/products" });
  }

  function handleCancel() {
    void navigate({ to: "/products" });
  }

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <ProductDetailBackLink />
        <ProductNewHeader />

        <div className="mt-6 grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="min-w-0">
            <ProductNewTabs active={tab} errorCounts={errorCounts} />
            <Suspense fallback={null}>
              {tab === "overview" && <ProductOverviewFormTab />}
              {tab === "admissions" && <ProductAdmissionsFormTab />}
              {tab === "fees" && <ProductFeesFormTab />}
            </Suspense>
          </main>
          <aside className="lg:sticky lg:top-6">
            <ProductNewSidebar />
          </aside>
        </div>

        <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-border bg-background/95 py-4 backdrop-blur">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit">Create course</Button>
        </div>
      </form>
    </Form>
  );
}

// Which fields belong to which tab's main canvas. `name` + `status` live
// in the always-visible header so their errors render inline (no chip).
const TAB_FIELDS: Record<ProductNewTab, readonly (keyof ProductFormValues)[]> = {
  overview: [
    "institution",
    "country",
    "studyLevel",
    "code",
    "description",
    "studyAreas",
    "courseDurations",
    "deliveryModes",
    "deliveryNotes",
  ],
  admissions: ["intakes", "branches", "entryRequirements"],
  fees: ["fees", "currency"],
};

function countErrorsByTab(errors: Record<string, unknown>): Partial<Record<ProductNewTab, number>> {
  const result: Partial<Record<ProductNewTab, number>> = {};
  for (const [tab, fields] of Object.entries(TAB_FIELDS) as [
    ProductNewTab,
    readonly (keyof ProductFormValues)[],
  ][]) {
    let count = 0;
    for (const field of fields) {
      if (errors[field as string]) {
        count += 1;
      }
    }
    if (count > 0) {
      result[tab] = count;
    }
  }
  return result;
}
