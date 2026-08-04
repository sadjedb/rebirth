import { Skeleton } from "@/components/admin/ui/Skeleton";

export default function EditProductLoading() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Skeleton className="h-4 w-56 mb-3" />
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
