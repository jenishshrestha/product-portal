import { Button } from "@shared/components/ui/Button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <Button variant="outline" size="icon" onClick={toggle}>
      {resolvedTheme === "dark" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
