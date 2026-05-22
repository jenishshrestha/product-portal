import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@shared/components/ui/Accordion";
import { Input } from "@shared/components/ui/Input";
import { Label } from "@shared/components/ui/Label";
import { useState } from "react";
import { SliderField } from "./SliderField";

export function ShadowControls() {
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowOpacity, setShadowOpacity] = useState(0.1);
  const [blurRadius, setBlurRadius] = useState(3);
  const [spread, setSpread] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(1);

  return (
    <Accordion type="multiple" defaultValue={["Shadow"]}>
      <AccordionItem value="Shadow">
        <AccordionTrigger className="text-sm font-medium">Shadow</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="size-8 shrink-0 rounded-md border border-border"
                  style={{ backgroundColor: shadowColor }}
                />
                <div>
                  <Label className="text-sm">Shadow Color</Label>
                  <p className="text-xs text-muted-foreground">{shadowColor}</p>
                </div>
              </div>
              <Input
                type="color"
                value={shadowColor}
                onChange={(e) => setShadowColor(e.target.value)}
                className="h-8 w-10 cursor-pointer border-none p-0"
              />
            </div>

            <SliderField
              label="Shadow Opacity"
              value={shadowOpacity}
              onChange={setShadowOpacity}
              min={0}
              max={1}
              step={0.05}
            />
            <SliderField
              label="Blur Radius"
              unit="px"
              value={blurRadius}
              onChange={setBlurRadius}
              min={0}
              max={50}
              integer
            />
            <SliderField
              label="Spread"
              unit="px"
              value={spread}
              onChange={setSpread}
              min={-20}
              max={20}
              integer
            />
            <SliderField
              label="Offset X"
              unit="px"
              value={offsetX}
              onChange={setOffsetX}
              min={-20}
              max={20}
              integer
            />
            <SliderField
              label="Offset Y"
              unit="px"
              value={offsetY}
              onChange={setOffsetY}
              min={-20}
              max={20}
              integer
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
