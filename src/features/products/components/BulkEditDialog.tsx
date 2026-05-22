import { Button } from "@shared/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/Dialog";
import { Label } from "@shared/components/ui/Label";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@shared/components/ui/NativeSelect";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type BulkMutationResult, useBulkEditProducts, useFilterOptions } from "../api/useProducts";
import { STATUS_LABELS } from "../lib/product-format";
import { PRODUCT_STATUSES } from "../types/product.types";
import { STUDY_LEVEL_GROUPS } from "./StudyLevelFilter";

type EditableField = "status" | "country" | "qualificationType";

const FIELD_OPTIONS: { value: EditableField; label: string }[] = [
  { value: "status", label: "Status" },
  { value: "country", label: "Country" },
  { value: "qualificationType", label: "Qualification Type" },
];

function buildPatch(field: EditableField, value: string): Record<string, unknown> {
  if (field === "status") return { status: value };
  if (field === "country") {
    return { institution_details: { institution_locations: [{ country: value }] } };
  }
  return { course_details: { course_level: { qualification_type: value } } };
}

function toastResult(result: BulkMutationResult, total: number): void {
  const { succeeded, failed } = result;
  if (failed.length === 0) {
    toast.success(`Updated ${succeeded.length} course${succeeded.length === 1 ? "" : "s"}.`);
  } else if (succeeded.length === 0) {
    toast.error(`Failed to update ${total} course${total === 1 ? "" : "s"}.`);
  } else {
    toast.warning(`Updated ${succeeded.length} of ${total} courses — ${failed.length} failed.`);
  }
}

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onApplied: () => void;
}

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedIds,
  onApplied,
}: BulkEditDialogProps) {
  const [field, setField] = useState<EditableField | "">("");
  const [value, setValue] = useState("");

  const { data: filterOptions } = useFilterOptions();
  const bulkEdit = useBulkEditProducts();

  useEffect(() => {
    if (open) {
      setField("");
      setValue("");
    }
  }, [open]);

  const countryOptions = filterOptions?.countries ?? [];
  const qtGroups = STUDY_LEVEL_GROUPS.filter((g) => g.options.length > 0);
  const canApply = field !== "" && value !== "" && !bulkEdit.isPending;

  async function handleApply() {
    if (!field || !value) return;
    const patch = buildPatch(field, value);
    const result = await bulkEdit.mutateAsync({ ids: selectedIds, patch });
    toastResult(result, selectedIds.length);
    if (result.failed.length === 0) {
      onOpenChange(false);
    }
    if (result.succeeded.length > 0) {
      onApplied();
    }
  }

  const count = selectedIds.length;
  const courseLabel = count === 1 ? "course" : "courses";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Bulk Edit ({count} {courseLabel})
          </DialogTitle>
          <DialogDescription>
            Choose a field and new value to apply to all selected courses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Field</Label>
            <NativeSelect
              value={field}
              onChange={(e) => {
                setField(e.target.value as EditableField | "");
                setValue("");
              }}
              className="w-full"
            >
              <option value="">Select a field…</option>
              {FIELD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </div>

          {field === "status" && (
            <div className="space-y-1.5">
              <Label className="text-sm">New value</Label>
              <NativeSelect
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full"
              >
                <option value="">Select a status…</option>
                {PRODUCT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          {field === "country" && (
            <div className="space-y-1.5">
              <Label className="text-sm">New value</Label>
              <NativeSelect
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full"
              >
                <option value="">Select a country…</option>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          {field === "qualificationType" && (
            <div className="space-y-1.5">
              <Label className="text-sm">New value</Label>
              <NativeSelect
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full"
              >
                <option value="">Select a qualification type…</option>
                {qtGroups.map((g) => (
                  <NativeSelectOptGroup key={g.group} label={g.group}>
                    {g.options.map((o) => (
                      <NativeSelectOption key={o} value={o}>
                        {o}
                      </NativeSelectOption>
                    ))}
                  </NativeSelectOptGroup>
                ))}
              </NativeSelect>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={bulkEdit.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!canApply}>
            {bulkEdit.isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Applying…
              </>
            ) : (
              `Apply to ${count} ${courseLabel}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
