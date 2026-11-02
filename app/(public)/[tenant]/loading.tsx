import { BoneyardSkeleton, PublicPageSkeleton } from "@/features/admin-panel/components/LoadingSkeletons";

export default function CafePageLoading() {
  return <BoneyardSkeleton name="public-cafe-page" loading fallback={<PublicPageSkeleton />} fixture={<PublicPageSkeleton />}><PublicPageSkeleton /></BoneyardSkeleton>;
}
