export const config = {
  app: {
    name: "Heubert",
    description: "Feature-driven app built with The React + AI Stack for 2026",
    version: "1.0.0",
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
    timeout: 30000,
  },
  features: {
    ai: {
      enabled: import.meta.env.VITE_ENABLE_AI === "true",
    },
    analytics: {
      enabled: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
    },
  },
  theme: {
    defaultTheme: "light" as const,
    enabledThemes: ["light", "dark", "system"] as const,
  },
} as const;

export type Config = typeof config;
