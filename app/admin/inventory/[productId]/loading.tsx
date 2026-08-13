import { Skeleton } from "@/components/admin/ui/Skeleton";

export default function ProductInventoryLoading() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Skeleton className="h-4 w-56 mb-3" />
      <Skeleton className="h-8 w-40 mb-6" />
      <Skeleton className="h-64 w-full rounded-lg mb-8" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}
