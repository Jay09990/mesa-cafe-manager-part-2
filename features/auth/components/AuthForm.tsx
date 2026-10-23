// Renders the shared Better Auth sign-in and sign-up form.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const isSignUp = mode === "sign-up";

  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const result = isSignUp
      ? await authClient.signUp.email({ name: String(formData.get("name") ?? ""), email, password })
      : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (result.error) setError("Check your email and password, then try again.");
    else router.push("/onboarding");
  }

  return (
    <form action={submit} className="w-full max-w-md space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-neutral-900">{isSignUp ? "Create your Mesa account" : "Sign in to Mesa"}</h1>
      {isSignUp && <label className="block text-base font-medium">Name<input name="name" required autoComplete="name" className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /></label>}
      <label className="block text-base font-medium">Email<input name="email" type="email" required autoComplete="email" className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /></label>
      <label className="block text-base font-medium">Password<input name="password" type="password" required minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="h-12 w-full rounded-md bg-neutral-900 px-4 text-base font-semibold text-white disabled:opacity-60">{busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}</button>
      <p className="text-sm text-neutral-600">{isSignUp ? "Already have an account?" : "New to Mesa?"} <a className="font-medium underline" href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</a></p>
    </form>
  );
}
