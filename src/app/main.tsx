import { configureDal, heubertErrorParser } from "@shared/lib/dal";
import { queryClient } from "@shared/lib/query/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import type { ErrorInfo, ReactNode } from "react";
import { Component, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../global.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Wire the DAL to the Heubert backend's error envelope (see docs/backend-integration.md).
configureDal({ errorParser: heubertErrorParser });

// queryClient is threaded into router context so route loaders can prefetch
// via `context.queryClient.ensureQueryData(...)`. Same instance as the
// <QueryClientProvider> in __root.tsx.
const router = createRouter({
  routeTree,
  context: { queryClient },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Root error boundary to catch unhandled errors
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Render the app
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </StrictMode>,
  );
}
