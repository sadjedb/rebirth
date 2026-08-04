import { SkeletonTableRow } from "@/components/admin/ui/Skeleton";

export default function OrdersLoading() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="h-4 w-48 rounded bg-admin-border/60 animate-pulse mb-3" />
      <div className="h-8 w-40 rounded bg-admin-border/60 animate-pulse mb-6" />
      <div className="rounded-lg border border-admin-border overflow-hidden">
        <div className="h-14 border-b border-admin-border" />
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonTableRow key={i} columns={7} />
        ))}
      </div>
    </div>
  );
}
