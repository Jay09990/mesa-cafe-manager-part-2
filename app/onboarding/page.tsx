// Collects the café name and slug after the owner creates an account.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OnboardingForm } from "@/features/tenant/components/OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4"><OnboardingForm /></main>;
}
