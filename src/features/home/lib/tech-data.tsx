import { AISDKLogo } from "../components/logos/AISDKLogo";
import { BiomeLogo } from "../components/logos/BiomeLogo";
import { HuskyLogo } from "../components/logos/HuskyLogo";
import { MotionLogo } from "../components/logos/MotionLogo";
import { PlaywrightLogo } from "../components/logos/PlaywrightLogo";
import { RadixLogo } from "../components/logos/RadixLogo";
import { ReactHookFormLogo } from "../components/logos/ReactHookFormLogo";
import { ReactLogo } from "../components/logos/ReactLogo";
import { ShadcnLogo } from "../components/logos/ShadcnLogo";
import { StorybookLogo } from "../components/logos/StorybookLogo";
import { TailwindLogo } from "../components/logos/TailwindLogo";
import { TanStackLogo } from "../components/logos/TanStackLogo";
import { TypeScriptLogo } from "../components/logos/TypeScriptLogo";
import { ViteLogo } from "../components/logos/ViteLogo";
import { VitestLogo } from "../components/logos/VitestLogo";
import { ZodLogo } from "../components/logos/ZodLogo";
import { ZustandLogo } from "../components/logos/ZustandLogo";
import type { TechItem } from "../types";

export const technologies: TechItem[] = [
  { icon: <ViteLogo />, name: "Vite", url: "https://vite.dev" },
  { icon: <ReactLogo />, name: "React", url: "https://react.dev" },
  { icon: <TypeScriptLogo />, name: "TypeScript", url: "https://typescriptlang.org" },
  { icon: <TailwindLogo />, name: "Tailwind CSS", url: "https://tailwindcss.com" },
  { icon: <ShadcnLogo />, name: "shadcn/ui", url: "https://ui.shadcn.com" },
  { icon: <RadixLogo />, name: "Radix UI", url: "https://radix-ui.com" },
  { icon: <TanStackLogo />, name: "TanStack", url: "https://tanstack.com" },
  { icon: <ZustandLogo />, name: "Zustand", url: "https://zustand.docs.pmnd.rs" },
  { icon: <ReactHookFormLogo />, name: "React Hook Form", url: "https://react-hook-form.com" },
  { icon: <ZodLogo />, name: "Zod", url: "https://zod.dev" },
  { icon: <MotionLogo />, name: "Motion", url: "https://motion.dev" },
  { icon: <AISDKLogo />, name: "Vercel AI SDK", url: "https://sdk.vercel.ai" },
  { icon: <VitestLogo />, name: "Vitest", url: "https://vitest.dev" },
  { icon: <PlaywrightLogo />, name: "Playwright", url: "https://playwright.dev" },
  { icon: <StorybookLogo />, name: "Storybook", url: "https://storybook.js.org" },
  { icon: <BiomeLogo />, name: "Biome", url: "https://biomejs.dev" },
  { icon: <HuskyLogo />, name: "Husky", url: "https://typicode.github.io/husky" },
];
