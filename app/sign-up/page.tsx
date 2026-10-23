// Shows the Better Auth account creation flow.
import { AuthForm } from "@/features/auth/components/AuthForm";

export default function SignUpPage() {
  return <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4"><AuthForm mode="sign-up" /></main>;
}
