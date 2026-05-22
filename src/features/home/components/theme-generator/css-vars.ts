export function getComputedCssVar(variable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

export function setCssVar(variable: string, value: string) {
  document.documentElement.style.setProperty(variable, value);
}

/**
 * Remove an inline CSS var override from the root element so the stylesheet's
 * declaration wins again. Needed because inline `style="..."` outranks
 * class-based `:root.dark { ... }` and would otherwise block theme switching.
 */
export function removeCssVar(variable: string) {
  document.documentElement.style.removeProperty(variable);
}
