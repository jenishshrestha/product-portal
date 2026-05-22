import { Checkbox } from "@shared/components/ui/Checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/components/ui/Form";
import { Input } from "@shared/components/ui/Input";
import { Label } from "@shared/components/ui/Label";
import { RichTextEditor } from "@shared/components/ui/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/Select";
import { useFormContext } from "react-hook-form";
import {
  CURRENCIES,
  INTAKE_MONTHS,
  PRODUCT_STATUSES,
  type ProductFormValues,
  STUDY_LEVELS,
} from "../lib/product.schema";
import { STATUS_LABELS, STUDY_LEVEL_LABELS } from "../lib/product-format";
import { BranchEditor } from "./BranchEditor";
import { EntryRequirementsEditor } from "./EntryRequirementsEditor";
import { StudyAreasField } from "./StudyAreasField";

interface ProductFormProps {
  existingBranchIds: Set<string>;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border">
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

export function ProductFormBody({ existingBranchIds }: ProductFormProps) {
  const form = useFormContext<ProductFormValues>();

  return (
    <div className="space-y-5">
      {/* ── Product Details ── */}
      <FormSection title="Product Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Master of Business Administration" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="MBA-001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="institution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Massey University" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="New Zealand" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="studyAreas"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Study areas</FormLabel>
                <FormControl>
                  <StudyAreasField
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="studyLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Study level</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STUDY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {STUDY_LEVEL_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Duration now lives in `courseDurations[]` — this legacy modal
              will be replaced by the full-page New/Edit form before
              duration editing lands here. Keep a placeholder column so
              the grid layout doesn't collapse. */}
          <div aria-hidden />
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <FormField
              control={form.control}
              name="fees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fees</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const raw = event.target.value;
                        field.onChange(raw === "" ? 0 : Number(raw));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((ccy) => (
                        <SelectItem key={ccy} value={ccy}>
                          {ccy}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <RichTextEditor
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                  placeholder="Brief overview of the course…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormSection>

      {/* ── Intakes ── */}
      <FormSection title="Intakes">
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
      </FormSection>

      {/* ── Branches ── */}
      <FormSection title="Branches">
        <BranchEditor existingBranchIds={existingBranchIds} />
      </FormSection>

      {/* ── Entry Requirements ── */}
      <FormSection title="Entry Requirements">
        <EntryRequirementsEditor />
      </FormSection>

      {/* ── Status ── */}
      <FormSection title="Status">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRODUCT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormSection>
    </div>
  );
}
