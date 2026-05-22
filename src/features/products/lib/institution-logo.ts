/**
 * Deterministic tile label + gradient for an institution. Pure algorithm —
 * no lookup table — so the frontend doesn't need to be edited every time a
 * new institution appears in the backend.
 *
 * Shape:
 *   name ──► short (initials, stopwords lowercase)
 *   short ─► 32-bit hash ─► hue (0–359°) ─► OKLCH gradient
 */

const STOPWORDS = new Set(["of", "the", "and", "for", "in", "&"]);

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0; // ~ h * 31 + charCode, truncated int32
  }
  return Math.abs(h);
}

/**
 * Initials with a style tweak: stopwords stay lowercase (so
 * "University of Melbourne" → "UoM", not "UM"). Single-word inputs fall
 * back to the first three characters ("Monash" → "MON").
 */
function deriveShort(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    return "?";
  }
  if (words.length === 1) {
    return (words[0] ?? "").slice(0, 3).toUpperCase();
  }

  return words
    .map((word) => {
      const first = word[0] ?? "";
      return STOPWORDS.has(word.toLowerCase()) ? first.toLowerCase() : first.toUpperCase();
    })
    .join("")
    .slice(0, 4);
}

export function institutionShort(name: string | undefined): string {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) {
    return "?";
  }
  return deriveShort(trimmed);
}

/**
 * Gradient is driven by the **short code** rather than the full name so
 * variants like "University of Melbourne" and "UoM" still land on the
 * same hue (same short → same hash → same hue).
 *
 * Gradient is 135°, two OKLCH stops with fixed lightness (0.58 → 0.50)
 * and chroma (0.18 → 0.17); only hue varies across institutions. White
 * text stays legible at every hue at those L/C values.
 */
export function institutionLogoBg(name: string | undefined): string {
  const short = institutionShort(name);
  const seed = hash(short);
  const hue = seed % 360;
  const secondHue = (hue + 23) % 360;
  return `linear-gradient(135deg, oklch(0.58 0.18 ${hue}), oklch(0.50 0.17 ${secondHue}))`;
}
