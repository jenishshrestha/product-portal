import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
vi.stubEnv("VITE_API_URL", "http://localhost:5173");
