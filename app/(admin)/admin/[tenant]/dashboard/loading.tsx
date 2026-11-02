import { BoneyardSkeleton, DashboardSkeleton } from "@/features/admin-panel/components/LoadingSkeletons";

export default function DashboardLoading() {
  return <BoneyardSkeleton name="dashboard-route" loading fallback={<DashboardSkeleton />} fixture={<DashboardSkeleton />}><DashboardSkeleton /></BoneyardSkeleton>;
}
