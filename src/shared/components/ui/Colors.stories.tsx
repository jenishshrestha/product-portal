import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef, useState } from "react";

interface ColorToken {
  name: string;
  variable: string;
}

/** Exclude non-color CSS custom properties */
const EXCLUDED_PREFIXES = ["--radius", "--font", "--animate", "--tw-", "--color-", "--spacing"];
const EXCLUDED_EXACT = ["--font-weight-bold"];

function isColorVariable(name: string): boolean {
  if (EXCLUDED_EXACT.includes(name)) {
    return false;
  }
  return !EXCLUDED_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/** Convert `--sidebar-primary-foreground` → `Sidebar Primary Foreground` */
function variableToName(variable: string): string {
  return variable
    .replace(/^--/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Parse all CSS custom properties from `:root` and `.dark` rules in stylesheets */
function discoverColorTokens(): ColorToken[] {
  const variables = new Set<string>();

  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (!(rule instanceof CSSStyleRule)) {
          continue;
        }
        if (rule.selectorText !== ":root" && rule.selectorText !== ".dark") {
          continue;
        }

        for (const prop of rule.style) {
          if (prop.startsWith("--") && isColorVariable(prop)) {
            variables.add(prop);
          }
        }
      }
    } catch {
      // Skip cross-origin stylesheets
    }
  }

  return Array.from(variables)
    .sort()
    .map((variable) => ({ name: variableToName(variable), variable }));
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function getResolvedColor(el: HTMLElement, variable: string): { hex: string; oklch: string } {
  const raw = getComputedStyle(el).getPropertyValue(variable).trim();

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { hex: "#000000", oklch: raw };
  }

  ctx.fillStyle = raw;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;

  return { hex: rgbToHex(r, g, b), oklch: raw };
}

function ColorSwatch({ name, variable }: ColorToken) {
  const ref = useRef<HTMLDivElement>(null);
  const [colorInfo, setColorInfo] = useState({ hex: "", oklch: "" });

  useEffect(() => {
    function resolve() {
      if (!ref.current) {
        return;
      }
      setColorInfo(getResolvedColor(ref.current, variable));
    }
    resolve();

    const observer = new MutationObserver(resolve);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [variable]);

  return (
    <div className="flex flex-col" ref={ref}>
      <div
        className="relative flex h-28 items-end rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden"
        style={{ backgroundColor: `var(${variable})` }}
      >
        <span className="relative z-10 bg-black/50 backdrop-blur-sm text-white text-xs font-mono px-2 py-1 rounded-tr-md">
          {colorInfo.hex.toUpperCase()}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground font-mono">{colorInfo.oklch || variable}</p>
    </div>
  );
}

function ColorPalette() {
  const [tokens, setTokens] = useState<ColorToken[]>([]);

  useEffect(() => {
    setTokens(discoverColorTokens());
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Color Palette</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-discovered from CSS custom properties in{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">global.css</code>. Use the theme
          toggle in the toolbar to switch between light and dark.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{tokens.length} tokens found</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {tokens.map((token) => (
          <ColorSwatch key={token.variable} {...token} />
        ))}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Design System/Colors",
  component: ColorPalette,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj;

/**
 * Auto-discovered color tokens from CSS custom properties. Add or change
 * colors in `global.css` and they appear here automatically.
 */
export const Default: Story = {};
