// Shows the Better Auth sign-in flow.
import { AuthForm } from "@/features/auth/components/AuthForm";

export default function SignInPage() {
  return <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4"><AuthForm mode="sign-in" /></main>;
}
