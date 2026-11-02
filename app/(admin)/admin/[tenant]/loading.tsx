import { AdminPageSkeleton } from "@/features/admin-panel/components/LoadingSkeletons";
import { BoneyardSkeleton } from "@/features/admin-panel/components/LoadingSkeletons";

export default function AdminLoading() {
  return <div className="w-full p-1"><BoneyardSkeleton name="admin-page" loading fallback={<AdminPageSkeleton />} fixture={<AdminPageSkeleton />}><AdminPageSkeleton /></BoneyardSkeleton></div>;
}
