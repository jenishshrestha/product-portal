import { Input } from "@shared/components/ui/Input";
import { Label } from "@shared/components/ui/Label";
import type { ColorEntry } from "./constants";

interface ColorRowProps {
  entry: ColorEntry;
  value: string;
  onChange: (variable: string, value: string) => void;
}

export function ColorRow({ entry, value, onChange }: ColorRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3">
        <div
          className="size-8 shrink-0 rounded-md border border-border"
          style={{ backgroundColor: value }}
        />
        <div>
          <Label className="text-sm">{entry.label}</Label>
          <p className="text-xs text-muted-foreground">{value}</p>
        </div>
      </div>
      <Input
        type="color"
        value={value.startsWith("#") ? value : "#000000"}
        onChange={(e) => onChange(entry.variable, e.target.value)}
        className="h-8 w-10 cursor-pointer border-none p-0"
      />
    </div>
  );
}
