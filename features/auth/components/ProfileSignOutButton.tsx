"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ProfileSignOutButton() {
  const router = useRouter();
  return <Button type="button" variant="outline" onClick={() => void authClient.signOut().then(() => router.replace("/sign-in"))}>Sign out</Button>;
}
