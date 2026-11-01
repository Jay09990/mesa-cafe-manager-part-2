// Creates the first trial tenant without requiring a paid plan choice.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { focusFormField } from "@/lib/form-feedback";
import { readApiResponse } from "@/lib/read-api-response";
import { LoadingSpinner } from "@/features/admin-panel/components/LoadingSpinner";

export function OnboardingForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(formData: FormData, form: HTMLFormElement) {
    setBusy(true);
    setError("");
    try { const response = await fetch("/api/auth/tenant-setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tenantName: formData.get("tenantName"), slug: formData.get("slug") }),
    });
    const result = await readApiResponse<{ slug: string }>(response);
    if (!result.success) { setError(result.errormsg); focusFormField(form, result.errormsg); }
    else router.push(`/admin/${result.data.slug}/dashboard`);
    } catch { const message = "We could not connect. Check the café details and try again."; setError(message); focusFormField(form, "tenantName"); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget), event.currentTarget); }} className="w-full max-w-md space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div><h1 className="text-2xl font-semibold">Set up your café</h1><p className="mt-2 text-neutral-600">Your 30-day trial starts when you continue. No plan or payment details needed.</p></div>
      <label className="block text-base font-medium">Café name<input name="tenantName" required minLength={2} maxLength={100} className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /></label>
      <label className="block text-base font-medium">Web address<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={50} className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /><span className="mt-1 block text-sm font-normal text-neutral-600">Use lowercase letters, numbers, and hyphens.</span></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="h-12 w-full rounded-md bg-neutral-900 px-4 font-semibold text-white disabled:opacity-60">{busy ? <LoadingSpinner label="Setting up…" /> : "Start free trial"}</button>
    </form>
  );
}
