import { Button } from "@shared/components/ui/Button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/components/ui/Form";
import { Input } from "@shared/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/Select";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { DURATION_UNITS, type ProductFormValues, STUDY_MODES } from "../lib/product.schema";

/**
 * Repeater for `course_durations[]`. Matches the v19 row shape — a course
 * can declare multiple durations (e.g. 4yr FT + 6yr PT) and each row
 * carries value + unit + optional study mode / option / locations.
 *
 * The first row is treated as the default by the detail page — row order
 * is the admin's responsibility (drag-to-reorder is out of scope here).
 */
export function CourseDurationsEditor() {
  const form = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "courseDurations",
    keyName: "_rhfKey",
  });

  function addDuration() {
    append({
      id: crypto.randomUUID(),
      value: 0,
      unit: "Years",
    });
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">No durations yet. Add at least one row.</p>
      )}

      {fields.map((field, index) => (
        <div
          key={field._rhfKey}
          className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-[120px_140px_minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <FormField
            control={form.control}
            name={`courseDurations.${index}.value`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={f.value ?? ""}
                    onChange={(e) => f.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`courseDurations.${index}.unit`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select value={f.value} onValueChange={f.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DURATION_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
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
            name={`courseDurations.${index}.studyMode`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Study mode</FormLabel>
                <Select value={f.value ?? ""} onValueChange={f.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STUDY_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
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
            name={`courseDurations.${index}.locations`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Locations</FormLabel>
                <FormControl>
                  <Input {...f} value={f.value ?? ""} placeholder="e.g. Footscray Park Campus" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label="Remove duration"
            >
              <TrashIcon className="size-4" />
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addDuration}>
        <PlusIcon className="size-4" />
        Add duration
      </Button>
    </div>
  );
}
