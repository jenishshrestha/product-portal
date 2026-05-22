import { Button } from "@shared/components/ui/Button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/components/ui/Form";
import { Input } from "@shared/components/ui/Input";
import { Textarea } from "@shared/components/ui/Textarea";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { ProductFormValues } from "../lib/product.schema";

/**
 * Repeater for `delivery_modes[]` plus the free-form `delivery_notes`.
 * The row shape stays simple (mode + comma-separated locations string) —
 * the comma split to v19's `locations: string[]` happens at save time,
 * not in the form state, so the input reads as plain text and round-trips
 * without splitting the user's cursor position.
 */
export function DeliveryModesEditor() {
  const form = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "deliveryModes",
    keyName: "_rhfKey",
  });

  function addMode() {
    append({
      id: crypto.randomUUID(),
      deliveryMode: "",
      locations: "",
    });
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No delivery modes yet. Add one to describe how this course is taught.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field._rhfKey}
          className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <FormField
            control={form.control}
            name={`deliveryModes.${index}.deliveryMode`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Delivery mode</FormLabel>
                <FormControl>
                  <Input {...f} placeholder="On campus / In person" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`deliveryModes.${index}.locations`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Locations</FormLabel>
                <FormControl>
                  <Input
                    {...f}
                    value={f.value ?? ""}
                    placeholder="Comma-separated, e.g. Footscray Park, City Campus"
                  />
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
              aria-label="Remove delivery mode"
            >
              <TrashIcon className="size-4" />
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addMode}>
        <PlusIcon className="size-4" />
        Add delivery mode
      </Button>

      <FormField
        control={form.control}
        name="deliveryNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Delivery notes</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Optional notes about delivery (blended schedules, hybrid availability, etc.)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
