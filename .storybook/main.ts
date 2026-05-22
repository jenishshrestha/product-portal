import path from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const __dirname = import.meta.dirname;

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@chromatic-com/storybook", "@storybook/addon-themes"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "../src"),
      "@shared": path.resolve(__dirname, "../src/shared"),
      "@features": path.resolve(__dirname, "../src/features"),
      "@app": path.resolve(__dirname, "../src/app"),
    };
    return config;
  },
};

export default config;
