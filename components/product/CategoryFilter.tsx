import Link from "next/link";
import type { Category } from "@/lib/products/storefront";

export function CategoryFilter({
  categories,
  active,
}: {
  categories: Category[];
  active?: string;
}) {
  const tabs: { slug: string | undefined; label: string }[] = [
    { slug: undefined, label: "All" },
    ...categories.map((c) => ({ slug: c.slug, label: c.name })),
  ];

  return (
    <nav aria-label="Filter by category" className="flex flex-wrap gap-x-8 gap-y-3">
      {tabs.map((tab) => {
        const isActive = tab.slug === active;
        const href = tab.slug ? `/collection?category=${tab.slug}` : "/collection";
        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`text-[13px] uppercase tracking-[0.14em] pb-1 border-b transition-colors ${
              isActive
                ? "text-sumi border-sumi"
                : "text-stone border-transparent hover:text-sumi"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
