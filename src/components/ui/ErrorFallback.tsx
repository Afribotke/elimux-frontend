"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Section-level error boundary fallback — for wrapping a widget/panel
 * (e.g. a dashboard chart) rather than a whole route. Route-level errors
 * are already handled by src/app/error.tsx and global-error.tsx.
 */
export function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("UI Error:", error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-display-3 font-display tracking-tight text-foreground mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
