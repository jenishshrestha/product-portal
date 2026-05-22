import { cn } from "@shared/lib/utils";
import { institutionLogoBg, institutionShort } from "../lib/institution-logo";

interface InstitutionLogoProps {
  name: string | undefined;
  /** `sm` = 28×28 (table rows), `md` = 40×40 (card grid), `lg` = 44×44 (detail sidebar). */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Small coloured tile with the institution's derived short code. Hue is
 * deterministic per-name so re-rendering a list doesn't reshuffle colours.
 * Matches the Claude Design `.cc-logo` styling.
 */
export function InstitutionLogo({ name, size = "sm", className }: InstitutionLogoProps) {
  const short = institutionShort(name);
  const background = institutionLogoBg(name);
  return (
    <span
      aria-hidden
      style={{ background }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold text-white tracking-[-0.01em]",
        size === "lg"
          ? "size-11 rounded-lg text-[0.9375rem]"
          : size === "md"
            ? "size-10 rounded-lg text-xs"
            : "size-7 rounded-md text-[0.625rem]",
        className,
      )}
    >
      {short}
    </span>
  );
}
