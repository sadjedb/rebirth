import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-admin-muted">/</span>}
              {item.href && !isLast ? (
                <Link href={item.href} className="text-admin-muted hover:text-admin-fg transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-admin-fg font-medium" : "text-admin-muted"}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
