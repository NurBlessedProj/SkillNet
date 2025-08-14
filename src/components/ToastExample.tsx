"use client";

import { useToast } from "@/hooks/useToast";
import { Button } from "./ui/button";

export default function ToastExample() {
  const { success, error, loading, dismiss, promise } = useToast();

  const handleSuccess = () => {
    success("This is a success message!");
  };

  const handleError = () => {
    error("This is an error message!");
  };

  const handleLoading = () => {
    const toastId = loading("This is a loading message...");
    // Dismiss after 3 seconds
    setTimeout(() => {
      dismiss(toastId);
    }, 3000);
  };

  const handlePromise = () => {
    const fakePromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve("Success!") : reject("Error!");
      }, 2000);
    });

    promise(fakePromise, {
      loading: "Processing...",
      success: "Operation completed successfully!",
      error: "Something went wrong!",
    });
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Toast Examples</h2>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSuccess} variant="default">
          Success Toast
        </Button>
        <Button onClick={handleError} variant="destructive">
          Error Toast
        </Button>
        <Button onClick={handleLoading} variant="outline">
          Loading Toast
        </Button>
        <Button onClick={handlePromise} variant="secondary">
          Promise Toast
        </Button>
      </div>
    </div>
  );
}

