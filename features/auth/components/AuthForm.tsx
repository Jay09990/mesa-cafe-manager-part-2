// Renders the shared Better Auth sign-in and sign-up form.
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { focusFormField } from "@/lib/form-feedback";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { LoadingSpinner } from "@/features/admin-panel/components/LoadingSpinner";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const isSignUp = mode === "sign-up";

  async function submit(formData: FormData, form: HTMLFormElement) {
    setBusy(true);
    setError("");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name: String(formData.get("name") ?? ""), email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) { const message = result.error.message || "Check your email and password, then try again."; setError(message); focusFormField(form, message); }
      else router.replace(isSignUp ? "/onboarding" : "/auth/continue");
    } catch { setError("We could not connect. Check your connection and try again."); focusFormField(form, "email"); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget), event.currentTarget); }} className="w-full max-w-md space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-neutral-900">{isSignUp ? "Create your Mesa account" : "Sign in to Mesa"}</h1>
      {isSignUp && <div className="space-y-2"><label htmlFor="auth-name" className="block text-base font-medium text-neutral-900">Full name</label><input id="auth-name" name="name" required autoComplete="name" placeholder="Your name" className="h-12 w-full rounded-md border border-neutral-300 bg-white px-3 text-neutral-900 placeholder:text-neutral-500" /></div>}
      <div className="space-y-2"><label htmlFor="auth-email" className="block text-base font-medium text-neutral-900">Email address</label><input id="auth-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="h-12 w-full rounded-md border border-neutral-300 bg-white px-3 text-neutral-900 placeholder:text-neutral-500" /></div>
      <div className="space-y-2"><label htmlFor="auth-password" className="block text-base font-medium text-neutral-900">Password</label><PasswordField id="auth-password" name="password" required minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} placeholder={isSignUp ? "At least 8 characters" : "Enter your password"} className="h-12 w-full rounded-md border border-neutral-300 bg-white px-3 text-neutral-900 placeholder:text-neutral-500" /></div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="h-12 w-full rounded-md bg-neutral-900 px-4 text-base font-semibold text-white disabled:opacity-60">{busy ? <LoadingSpinner label={isSignUp ? "Creating account…" : "Signing in…"} /> : isSignUp ? "Create account" : "Sign in"}</button>
      {!isSignUp && <Link className="block text-sm font-medium text-neutral-700 underline" href="/forgot-password">Forgot password?</Link>}
      <p className="text-sm text-neutral-600">{isSignUp ? "Already have an account?" : "New to Mesa?"} <a className="font-medium underline" href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</a></p>
    </form>
  );
}
