import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/components/ui/Form";
import { Input } from "@shared/components/ui/Input";
import { RichTextEditor } from "@shared/components/ui/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/Select";
import { BookIcon, ClockIcon, GraduationCapIcon, MonitorIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { CourseDurationsEditor } from "../../components/CourseDurationsEditor";
import { DeliveryModesEditor } from "../../components/DeliveryModesEditor";
import { StudyAreasField } from "../../components/StudyAreasField";
import { DetailCard } from "../../detail/components/DetailCard";
import {
  INTL_STUDENT_OPTIONS,
  type ProductFormValues,
  STUDY_LEVELS,
} from "../../lib/product.schema";
import { STUDY_LEVEL_LABELS } from "../../lib/product-format";

/**
 * Overview tab — same cards in the same order as the detail page's
 * Overview tab:
 *   1. Classification (institution, country, study level, code) —
 *      pragmatic addition. Not on the detail Overview tab, but the fields
 *      have to live somewhere on the canvas; grouping them at the top
 *      keeps them predictable.
 *   2. Course overview — prose (RichTextEditor) + study-areas chips.
 *   3. Duration & study mode — repeater matching v19 `course_durations[]`.
 *   4. Delivery modes — repeater matching v19 `delivery_modes[]` plus
 *      the optional `delivery_notes`.
 *
 * Campus locations + Accreditations also appear on the detail Overview
 * tab but live in the Admissions tab here (per the feature plan).
 */
export function ProductOverviewFormTab() {
  const form = useFormContext<ProductFormValues>();

  return (
    <div className="space-y-4">
      <DetailCard title="Classification" icon={GraduationCapIcon}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            name="studyLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Study level</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="—" />
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
          <FormField
            control={form.control}
            name="qualification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Qualification</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Bachelor's Degree / Honours Degree"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="acceptsInternational"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accepts international students</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INTL_STUDENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Input {...field} placeholder="MBA-001" className="font-mono" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </DetailCard>

      <DetailCard title="Course overview" icon={BookIcon}>
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Overview</FormLabel>
                <FormControl>
                  <RichTextEditor
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                    placeholder="Brief overview of the course — what students study, what the programme aims at, and what graduates typically go on to do."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="h-px bg-border-subtle" />

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
        </div>
      </DetailCard>

      <DetailCard title="Duration & study mode" icon={ClockIcon}>
        <CourseDurationsEditor />
      </DetailCard>

      <DetailCard title="Delivery modes" icon={MonitorIcon}>
        <DeliveryModesEditor />
      </DetailCard>
    </div>
  );
}
