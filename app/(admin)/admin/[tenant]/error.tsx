"use client";

import { useEffect } from "react";
import { DatabaseUnavailable } from "@/features/admin-panel/components/DatabaseUnavailable";
import { isTransientDatabaseFailure } from "@/features/auth/database-errors";
import { Button } from "@/components/ui/button";

export default function TenantAdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("Tenant admin route failed", error);
  }, [error]);

  if (isTransientDatabaseFailure(error)) return <DatabaseUnavailable onRetry={retry} />;

  return (
    <main className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">This page couldn’t load</h1>
      <p className="mt-2 text-sm text-muted-foreground">Please try again. If the problem continues, contact support.</p>
      <Button type="button" onClick={retry} className="mt-6">Try again</Button>
    </main>
  );
}
