import { SkeletonStatCard, SkeletonTableRow } from "@/components/admin/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="h-4 w-40 rounded bg-admin-border/60 animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="rounded-lg border border-admin-border overflow-hidden">
        <SkeletonTableRow />
        <SkeletonTableRow />
        <SkeletonTableRow />
      </div>
    </div>
  );
}
