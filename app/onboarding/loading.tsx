import { BoneyardSkeleton, AdminPageSkeleton } from "@/features/admin-panel/components/LoadingSkeletons";

export default function OnboardingLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4"><div className="w-full max-w-md"><BoneyardSkeleton name="onboarding-form" loading fallback={<AdminPageSkeleton />} fixture={<AdminPageSkeleton />}><AdminPageSkeleton /></BoneyardSkeleton></div></main>;
}
