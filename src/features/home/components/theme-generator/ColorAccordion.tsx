import { AccordionContent, AccordionItem, AccordionTrigger } from "@shared/components/ui/Accordion";
import { ColorRow } from "./ColorRow";
import type { ColorEntry } from "./constants";

interface ColorAccordionProps {
  title: string;
  entries: ColorEntry[];
  colors: Record<string, string>;
  onChange: (variable: string, value: string) => void;
}

export function ColorAccordion({ title, entries, colors, onChange }: ColorAccordionProps) {
  return (
    <AccordionItem value={title}>
      <AccordionTrigger className="text-sm font-medium">{title}</AccordionTrigger>
      <AccordionContent>
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <ColorRow
              key={entry.variable}
              entry={entry}
              value={colors[entry.variable] ?? ""}
              onChange={onChange}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
