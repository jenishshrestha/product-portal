import { Checkbox } from "@shared/components/ui/Checkbox";
import { FormField, FormItem, FormMessage } from "@shared/components/ui/Form";
import { Label } from "@shared/components/ui/Label";
import { BookOpenIcon, CalendarIcon, MapPinIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { BranchEditor } from "../../components/BranchEditor";
import { EntryRequirementsEditor } from "../../components/EntryRequirementsEditor";
import { DetailCard } from "../../detail/components/DetailCard";
import { INTAKE_MONTHS, type ProductFormValues } from "../../lib/product.schema";

/**
 * Admissions & Requirements tab. Reuses the existing `BranchEditor` and
 * `EntryRequirementsEditor` so the Edit modal and New page share the same
 * nested editors — any fixes to those field arrays land in both flows.
 */
export function ProductAdmissionsFormTab() {
  const form = useFormContext<ProductFormValues>();

  return (
    <div className="space-y-4">
      <DetailCard
        title="Intakes"
        icon={CalendarIcon}
        subtitle="Select the months new cohorts are accepted"
      >
        <FormField
          control={form.control}
          name="intakes"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {INTAKE_MONTHS.map((month) => {
                  const checked = field.value.includes(month);
                  return (
                    <Label
                      key={month}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          field.onChange(
                            next ? [...field.value, month] : field.value.filter((m) => m !== month),
                          );
                        }}
                      />
                      {month}
                    </Label>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </DetailCard>

      <DetailCard title="Campus branches" icon={MapPinIcon}>
        <BranchEditor existingBranchIds={EMPTY_BRANCH_ID_SET} />
      </DetailCard>

      <DetailCard title="Entry requirements" icon={BookOpenIcon}>
        <EntryRequirementsEditor />
      </DetailCard>
    </div>
  );
}

// New-course flow has no existing branches — pre-allocated so the ref stays
// stable across renders (BranchEditor reads it as a prop on every render).
const EMPTY_BRANCH_ID_SET: Set<string> = new Set();
