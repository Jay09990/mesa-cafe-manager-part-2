// Shows the signed-in user’s account profile.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProfileSignOutButton } from "@/features/auth/components/ProfileSignOutButton";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return <section className="w-full rounded-lg border border-border bg-card p-3">
    <div className="mb-2"><h1 className="text-xl font-semibold">Profile</h1><p className="text-sm text-muted-foreground">Your Mesa account details.</p></div>
    <dl className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-md bg-background p-2"><dt className="text-xs font-medium text-muted-foreground">Name</dt><dd className="mt-0.5 text-sm font-medium">{session.user.name}</dd></div>
      <div className="rounded-md bg-background p-2"><dt className="text-xs font-medium text-muted-foreground">Email</dt><dd className="mt-0.5 text-sm font-medium">{session.user.email}</dd></div>
    </dl>
    <div className="mt-3 border-t border-border pt-2"><ProfileSignOutButton /></div>
  </section>;
}
