import { Accordion } from "@shared/components/ui/Accordion";
import { ColorAccordion } from "./ColorAccordion";
import { ALL_COLOR_GROUPS } from "./constants";

interface ColorsTabProps {
  colors: Record<string, string>;
  onChange: (variable: string, value: string) => void;
}

export function ColorsTab({ colors, onChange }: ColorsTabProps) {
  return (
    <Accordion type="multiple" defaultValue={["Brand Colors"]} className="w-full">
      {ALL_COLOR_GROUPS.map((group) => (
        <ColorAccordion
          key={group.title}
          title={group.title}
          entries={group.entries}
          colors={colors}
          onChange={onChange}
        />
      ))}
    </Accordion>
  );
}
