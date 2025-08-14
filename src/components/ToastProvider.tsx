"use client";

import { Toaster } from "react-hot-toast";
import { useTheme } from "./context";

export default function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: theme === "dark" ? "#1f2937" : "#ffffff",
          color: theme === "dark" ? "#f9fafb" : "#111827",
          border: theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow:
            theme === "dark"
              ? "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)"
              : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        success: {
          iconTheme: {
            primary: "#10b981", // emerald-500
            secondary: theme === "dark" ? "#1f2937" : "#ffffff",
          },
          style: {
            background: theme === "dark" ? "#1f2937" : "#ffffff",
            color: theme === "dark" ? "#f9fafb" : "#111827",
            border:
              theme === "dark" ? "1px solid #10b981" : "1px solid #10b981",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444", // red-500
            secondary: theme === "dark" ? "#1f2937" : "#ffffff",
          },
          style: {
            background: theme === "dark" ? "#1f2937" : "#ffffff",
            color: theme === "dark" ? "#f9fafb" : "#111827",
            border:
              theme === "dark" ? "1px solid #ef4444" : "1px solid #ef4444",
          },
        },
        loading: {
          iconTheme: {
            primary: "#3b82f6", // blue-500
            secondary: theme === "dark" ? "#1f2937" : "#ffffff",
          },
          style: {
            background: theme === "dark" ? "#1f2937" : "#ffffff",
            color: theme === "dark" ? "#f9fafb" : "#111827",
            border:
              theme === "dark" ? "1px solid #3b82f6" : "1px solid #3b82f6",
          },
        },
      }}
    />
  );
}

