import { Skeleton } from "@/components/admin/ui/Skeleton";

export default function ReviewDetailLoading() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Skeleton className="h-4 w-56 mb-3" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-72 mb-6" />
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-36 w-full rounded-lg" />
      </div>
    </div>
  );
}
