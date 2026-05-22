export type ColorEntry = { label: string; variable: string };

export const BRAND_COLORS: ColorEntry[] = [
  { label: "Primary", variable: "--primary" },
  { label: "Primary Foreground", variable: "--primary-foreground" },
  { label: "Secondary", variable: "--secondary" },
  { label: "Secondary Foreground", variable: "--secondary-foreground" },
  { label: "Destructive", variable: "--destructive" },
  { label: "Destructive Foreground", variable: "--destructive-foreground" },
];

export const BASE_COLORS: ColorEntry[] = [
  { label: "Background", variable: "--background" },
  { label: "Foreground", variable: "--foreground" },
  { label: "Card", variable: "--card" },
  { label: "Card Foreground", variable: "--card-foreground" },
  { label: "Popover", variable: "--popover" },
  { label: "Popover Foreground", variable: "--popover-foreground" },
];

export const OTHER_COLORS: ColorEntry[] = [
  { label: "Muted", variable: "--muted" },
  { label: "Muted Foreground", variable: "--muted-foreground" },
  { label: "Accent", variable: "--accent" },
  { label: "Accent Foreground", variable: "--accent-foreground" },
  { label: "Border", variable: "--border" },
  { label: "Input", variable: "--input" },
  { label: "Ring", variable: "--ring" },
  { label: "Success", variable: "--success" },
];

export const SIDEBAR_COLORS: ColorEntry[] = [
  { label: "Sidebar", variable: "--sidebar" },
  { label: "Sidebar Foreground", variable: "--sidebar-foreground" },
  { label: "Sidebar Primary", variable: "--sidebar-primary" },
  { label: "Sidebar Primary Foreground", variable: "--sidebar-primary-foreground" },
  { label: "Sidebar Accent", variable: "--sidebar-accent" },
  { label: "Sidebar Accent Foreground", variable: "--sidebar-accent-foreground" },
  { label: "Sidebar Border", variable: "--sidebar-border" },
  { label: "Sidebar Ring", variable: "--sidebar-ring" },
];

export const CHART_COLORS: ColorEntry[] = [
  { label: "Chart 1", variable: "--chart-1" },
  { label: "Chart 2", variable: "--chart-2" },
  { label: "Chart 3", variable: "--chart-3" },
  { label: "Chart 4", variable: "--chart-4" },
  { label: "Chart 5", variable: "--chart-5" },
];

export const ALL_COLOR_GROUPS: Array<{ title: string; entries: ColorEntry[] }> = [
  { title: "Brand Colors", entries: BRAND_COLORS },
  { title: "Base Colors", entries: BASE_COLORS },
  { title: "Other Colors", entries: OTHER_COLORS },
  { title: "Sidebar Colors", entries: SIDEBAR_COLORS },
  { title: "Chart Colors", entries: CHART_COLORS },
];
