import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { SkeletonStatCard } from "@/components/admin/ui/Skeleton";

export default function AdminDashboardPage() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />

      <h1 className="text-2xl font-semibold text-admin-fg mt-3 mb-1">Dashboard</h1>
      <p className="text-sm text-admin-muted mb-8">
        This is the foundation module — sidebar, topbar, theme, command
        palette (⌘K / Ctrl K), and the authorization layer. Real metrics
        (revenue, orders, conversion, top products) land in the next module.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      <div className="rounded-lg border border-admin-border bg-admin-surface">
        <EmptyState
          title="No activity yet"
          description="Once the Products and Orders modules are live, recent activity and business metrics will populate here automatically."
        />
      </div>
    </div>
  );
}
