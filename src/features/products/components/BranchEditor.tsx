import { Button } from "@shared/components/ui/Button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/components/ui/Form";
import { Input } from "@shared/components/ui/Input";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { ProductFormValues } from "../lib/product.schema";

interface BranchEditorProps {
  existingBranchIds: Set<string>;
}

export function BranchEditor({ existingBranchIds }: BranchEditorProps) {
  const form = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "branches",
    keyName: "_rhfKey",
  });

  function addBranch() {
    append({ id: crypto.randomUUID(), name: "", country: "", address: "" });
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">No branches yet. Add at least one location.</p>
      )}

      {fields.map((field, index) => {
        const isExisting = existingBranchIds.has(field.id);
        return (
          <div
            key={field._rhfKey}
            className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <FormField
              control={form.control}
              name={`branches.${index}.name`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Branch name</FormLabel>
                  <FormControl>
                    <Input {...f} readOnly={isExisting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`branches.${index}.country`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...f} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`branches.${index}.address`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...f} value={f.value ?? ""} placeholder="Optional" />
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
                aria-label="Remove branch"
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={addBranch}>
        <PlusIcon className="size-4" />
        Add branch
      </Button>
    </div>
  );
}
