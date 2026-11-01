"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { LoadingSpinner } from "@/features/admin-panel/components/LoadingSpinner";

const fieldClass = "h-12 w-full rounded-md border border-neutral-300 bg-white px-3 text-neutral-900 placeholder:text-neutral-500";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    try {
      const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` });
      if (result.error) setError(result.error.message || "We could not send the reset email. Try again.");
      else setMessage("If an account exists for that email, a password reset link is on its way.");
    } catch {
      setError("We could not connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="w-full max-w-md space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="space-y-2"><h1 className="text-2xl font-semibold text-neutral-900">Forgot your password?</h1><p className="text-sm text-neutral-600">Enter your account email and we’ll send you a link to reset it.</p></div>
      <div className="space-y-2"><label htmlFor="recovery-email" className="block text-base font-medium text-neutral-900">Email address</label><input id="recovery-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={fieldClass} /></div>
      {message && <p role="status" className="text-sm text-green-700">{message}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="h-12 w-full rounded-md bg-neutral-900 px-4 text-base font-semibold text-white disabled:opacity-60">{busy ? <LoadingSpinner label="Sending…" /> : "Send reset link"}</button>
      <Link className="block text-sm font-medium text-neutral-700 underline" href="/sign-in">Back to sign in</Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirm-password") ?? "");
    if (password !== confirmation) {
      setError("Those passwords do not match.");
      setBusy(false);
      return;
    }
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setError("This reset link is missing or invalid. Request a new one.");
      setBusy(false);
      return;
    }
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) setError(result.error.message || "This reset link is invalid or expired. Request a new one.");
      else setMessage("Your password has been reset. You can now sign in with your new password.");
    } catch {
      setError("We could not connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="w-full max-w-md space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="space-y-2"><h1 className="text-2xl font-semibold text-neutral-900">Choose a new password</h1><p className="text-sm text-neutral-600">Use at least 8 characters for your new password.</p></div>
      <div className="space-y-2"><label htmlFor="new-password" className="block text-base font-medium text-neutral-900">New password</label><PasswordField id="new-password" name="password" required minLength={8} autoComplete="new-password" className={fieldClass} /></div>
      <div className="space-y-2"><label htmlFor="confirm-password" className="block text-base font-medium text-neutral-900">Confirm new password</label><PasswordField id="confirm-password" name="confirm-password" required minLength={8} autoComplete="new-password" className={fieldClass} /></div>
      {message && <p role="status" className="text-sm text-green-700">{message}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!message && <button type="submit" disabled={busy} className="h-12 w-full rounded-md bg-neutral-900 px-4 text-base font-semibold text-white disabled:opacity-60">{busy ? <LoadingSpinner label="Updating…" /> : "Reset password"}</button>}
      <Link className="block text-sm font-medium text-neutral-700 underline" href="/sign-in">Back to sign in</Link>
    </form>
  );
}
