import { Input } from "@shared/components/ui/Input";
import { Label } from "@shared/components/ui/Label";
import { Slider } from "@shared/components/ui/Slider";

interface SliderFieldProps {
  label: string;
  unit?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Use parseInt for integer sliders (px values). Defaults to parseFloat. */
  integer?: boolean;
}

export function SliderField({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step = 1,
  integer = false,
}: SliderFieldProps) {
  function parse(raw: string): number {
    return (integer ? Number.parseInt(raw, 10) : Number.parseFloat(raw)) || 0;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(parse(e.target.value))}
            className="h-8 w-16 text-right text-sm"
            step={step}
            min={min}
            max={max}
          />
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v = 0]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}
