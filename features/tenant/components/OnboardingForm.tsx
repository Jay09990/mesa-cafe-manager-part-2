// Creates the first trial tenant without requiring a paid plan choice.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/tenant-setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tenantName: formData.get("tenantName"), slug: formData.get("slug") }),
    });
    const result = await response.json();
    setBusy(false);
    if (!result.success) setError(result.errormsg);
    else router.push(`/admin/${result.data.slug}/dashboard`);
  }

  return (
    <form action={submit} className="w-full max-w-md space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div><h1 className="text-2xl font-semibold">Set up your café</h1><p className="mt-2 text-neutral-600">Your 30-day trial starts when you continue. No plan or payment details needed.</p></div>
      <label className="block text-base font-medium">Café name<input name="tenantName" required minLength={2} maxLength={100} className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /></label>
      <label className="block text-base font-medium">Web address<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={50} className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /><span className="mt-1 block text-sm font-normal text-neutral-600">Use lowercase letters, numbers, and hyphens.</span></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="h-12 w-full rounded-md bg-neutral-900 px-4 font-semibold text-white disabled:opacity-60">{busy ? "Setting up…" : "Start free trial"}</button>
    </form>
  );
}
