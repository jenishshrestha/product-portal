import { useState } from "react";
import { setCssVar } from "./css-vars";
import { ShadowControls } from "./ShadowControls";
import { SliderField } from "./SliderField";

export function OtherTab() {
  const [radius, setRadius] = useState(0.625);
  const [spacing, setSpacing] = useState(0.25);

  function handleRadiusChange(value: number) {
    setRadius(value);
    setCssVar("--radius", `${value}rem`);
  }

  return (
    <div className="space-y-6">
      <SliderField
        label="Radius"
        unit="rem"
        value={radius}
        onChange={handleRadiusChange}
        min={0}
        max={2}
        step={0.125}
      />
      <SliderField
        label="Spacing"
        unit="rem"
        value={spacing}
        onChange={setSpacing}
        min={0}
        max={1}
        step={0.05}
      />
      <ShadowControls />
    </div>
  );
}
