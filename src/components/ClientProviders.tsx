"use client";

import { ReactNode, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { ErrorBoundary } from "@sentry/nextjs";
import { DataProvider, ThemeProvider } from "@/components/context";
import ToastProvider from "./ToastProvider";
import { useRouter } from "next/navigation";
// Import the console override script early
import "@/utils/console-override.js";

// Custom Error Fallback Component that matches your app's style
const FallbackComponent = () => {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-3">Oops! Something went wrong</h2>
        <p className="text-muted-foreground mb-4">
          We've been notified and are working on the issue
        </p>
        <button
          onClick={() => router.refresh()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
};

export default function ClientProviders({ children }: { children: ReactNode }) {
  // Additional runtime check to ensure console methods are overridden
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // This will ensure console methods stay overridden even after React hydration
      console.log = () => {};
      console.error = () => {};
      console.warn = () => {};
      console.info = () => {};
      console.debug = () => {};
      console.trace = () => {};
    }
  }, []);

  return (
    <ThemeProvider>
      <DataProvider>
        <ErrorBoundary
          fallback={FallbackComponent}
          beforeCapture={(scope) => {
            scope.setTag("location", "client");
            scope.setLevel("error");
          }}
          showDialog={process.env.NODE_ENV === "development"}
        >
          {children}
          <ToastProvider />
        </ErrorBoundary>
      </DataProvider>
    </ThemeProvider>
  );
}
