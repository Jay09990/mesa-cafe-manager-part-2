"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DatabaseUnavailable({ onRetry }: { onRetry?: () => void }) {
  return (
    <main className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <Card className="w-full border-amber-200 p-4">
        <CardContent className="flex flex-col items-center px-4 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-foreground">Workspace is temporarily unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          We couldn’t connect to the database. Please try again in a moment.
        </p>
        <Button type="button" onClick={onRetry ?? (() => window.location.reload())} className="mt-6">
          Try again
        </Button>
        </CardContent>
      </Card>
    </main>
  );
}
