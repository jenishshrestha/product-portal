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
import { Switch } from "@shared/components/ui/Switch";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { EXAM_NAMES, type ProductFormValues } from "../lib/product.schema";

function numberInputProps(value: number | undefined, onChange: (v: number | undefined) => void) {
  return {
    type: "number" as const,
    inputMode: "decimal" as const,
    step: "any",
    value: value ?? "",
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      onChange(raw === "" ? undefined : Number(raw));
    },
  };
}

export function EntryRequirementsEditor() {
  const form = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entryRequirements",
    keyName: "_rhfKey",
  });

  function addRequirement() {
    append({
      id: crypto.randomUUID(),
      examName: "IELTS",
      overallScore: 0,
      minimumBandScores: {},
      recognized: true,
    });
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">No entry requirements yet.</p>
      )}

      {fields.map((field, index) => (
        <div key={field._rhfKey} className="space-y-3 rounded-md border border-border p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
            <FormField
              control={form.control}
              name={`entryRequirements.${index}.examName`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Exam</FormLabel>
                  <Select value={f.value} onValueChange={f.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXAM_NAMES.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
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
              name={`entryRequirements.${index}.overallScore`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Overall score</FormLabel>
                  <FormControl>
                    <Input {...numberInputProps(f.value, f.onChange)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`entryRequirements.${index}.recognized`}
              render={({ field: f }) => (
                <FormItem className="flex items-center gap-3">
                  <FormLabel className="text-sm">Recognized</FormLabel>
                  <FormControl>
                    <Switch checked={f.value} onCheckedChange={f.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Remove requirement"
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FormField
              control={form.control}
              name={`entryRequirements.${index}.minimumBandScores.reading`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Reading</FormLabel>
                  <FormControl>
                    <Input {...numberInputProps(f.value, f.onChange)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`entryRequirements.${index}.minimumBandScores.writing`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Writing</FormLabel>
                  <FormControl>
                    <Input {...numberInputProps(f.value, f.onChange)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`entryRequirements.${index}.minimumBandScores.listening`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Listening</FormLabel>
                  <FormControl>
                    <Input {...numberInputProps(f.value, f.onChange)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`entryRequirements.${index}.minimumBandScores.speaking`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Speaking</FormLabel>
                  <FormControl>
                    <Input {...numberInputProps(f.value, f.onChange)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addRequirement}>
        <PlusIcon className="size-4" />
        Add requirement
      </Button>
    </div>
  );
}
