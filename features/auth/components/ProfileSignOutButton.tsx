"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/features/admin-panel/components/LoadingSpinner";

export function ProfileSignOutButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setBusy(true);
    try {
      await authClient.signOut();
      router.replace("/sign-in");
    } catch {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={busy}
      onClick={() => void handleSignOut()}
    >
      {busy ? <LoadingSpinner label="Signing out…" /> : "Sign out"}
    </Button>
  );
}
