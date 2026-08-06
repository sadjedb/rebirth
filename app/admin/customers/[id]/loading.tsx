import { Skeleton } from "@/components/admin/ui/Skeleton";

export default function CustomerDetailLoading() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Skeleton className="h-4 w-56 mb-3" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-72 mb-6" />
      <div className="space-y-6">
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}
