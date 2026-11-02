// Sends returning users to an existing tenant and new users to setup.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserHome } from "@/features/auth/get-user-home";

export const instant = false;

export default async function ContinueAfterSignInPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const home = await getUserHome(session.user.id);
  redirect(home ?? "/onboarding");
}
