import { cn } from "@shared/lib/utils";

function splitIntoPoints(text: string): string[] | null {
  const trimmed = text.trim();

  // If text already has newlines, split on them.
  if (trimmed.includes("\n")) {
    const lines = trimmed
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length >= 2) return lines;
  }

  // Split on period + whitespace + capital letter (sentence boundary).
  // Avoids splitting on abbreviations, decimals, etc. because those are
  // followed by lowercase or digits, not an uppercase letter.
  const sentences = trimmed
    .split(/\.\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length >= 2 && sentences.every((s) => s.length >= 30)) {
    return sentences;
  }

  return null;
}

interface StructuredTextProps {
  text: string;
  className?: string;
}

export function StructuredText({ text, className }: StructuredTextProps) {
  const points = splitIntoPoints(text);

  if (points) {
    return (
      <ul className={cn("space-y-2", className)}>
        {points.map((p, i) => (
          <li key={i} className="flex gap-2.5 text-[0.8125rem] leading-[1.6] text-foreground">
            <span
              className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-muted-foreground/50"
              aria-hidden
            />
            {p}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p
      className={cn(
        "text-[0.8125rem] leading-[1.6] text-foreground text-pretty whitespace-pre-wrap",
        className,
      )}
    >
      {text}
    </p>
  );
}
