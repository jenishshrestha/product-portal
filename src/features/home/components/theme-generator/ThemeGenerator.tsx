import { Button } from "@shared/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@shared/components/ui/Sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/Tabs";
import { CopyIcon, MoonIcon, PaletteIcon, RotateCcwIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { ColorsTab } from "./ColorsTab";
import { ALL_COLOR_GROUPS } from "./constants";
import { getComputedCssVar, removeCssVar, setCssVar } from "./css-vars";
import { OtherTab } from "./OtherTab";

export function ThemeGenerator() {
  const { resolvedTheme, setTheme } = useTheme();
  const [colors, setColors] = useState<Record<string, string>>({});
  // Track which vars the user has overridden so Reset knows what to strip —
  // avoids removing vars that already had an inline value before we opened.
  const overriddenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const current: Record<string, string> = {};
    for (const group of ALL_COLOR_GROUPS) {
      for (const entry of group.entries) {
        current[entry.variable] = getComputedCssVar(entry.variable);
      }
    }
    setColors(current);
  }, []);

  function handleColorChange(variable: string, value: string) {
    setCssVar(variable, value);
    overriddenRef.current.add(variable);
    setColors((prev) => ({ ...prev, [variable]: value }));
  }

  function handleReset() {
    for (const variable of overriddenRef.current) {
      removeCssVar(variable);
    }
    overriddenRef.current.clear();
    const current: Record<string, string> = {};
    for (const group of ALL_COLOR_GROUPS) {
      for (const entry of group.entries) {
        current[entry.variable] = getComputedCssVar(entry.variable);
      }
    }
    setColors(current);
  }

  function handleCopyCSS() {
    const lines = Object.entries(colors)
      .map(([variable, value]) => `  ${variable}: ${value};`)
      .join("\n");
    navigator.clipboard.writeText(`:root {\n${lines}\n}`);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <PaletteIcon className="size-4" />
          <span className="sr-only">Customize theme</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-base font-semibold">Theme Generator</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4 pb-6">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopyCSS}>
                <CopyIcon className="size-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcwIcon className="size-4" />
                Reset
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Mode</p>
              <div className="flex gap-2">
                <Button
                  variant={resolvedTheme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  <SunIcon className="size-4" />
                  Light
                </Button>
                <Button
                  variant={resolvedTheme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  <MoonIcon className="size-4" />
                  Dark
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="colors" className="h-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger
                value="colors"
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Colors
              </TabsTrigger>
              <TabsTrigger
                value="typography"
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Typography
              </TabsTrigger>
              <TabsTrigger
                value="other"
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Other
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="m-0 pt-4">
              <ColorsTab colors={colors} onChange={handleColorChange} />
            </TabsContent>

            <TabsContent value="typography" className="m-0 pt-4">
              <p className="text-sm text-muted-foreground">Typography settings coming soon.</p>
            </TabsContent>

            <TabsContent value="other" className="m-0 pt-4">
              <OtherTab />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
