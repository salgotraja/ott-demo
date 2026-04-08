import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  crumbs: BreadcrumbItem[];
  sticky?: boolean;
}

export function PageBreadcrumb({ crumbs, sticky = false }: PageBreadcrumbProps) {
  return (
    <header
      className={`border-b border-zinc-800 bg-zinc-900/50 backdrop-blur${sticky ? " sticky top-0 z-10" : ""}`}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center gap-2 text-sm flex-wrap">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-zinc-600">/</span>}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="text-blue-400 hover:text-blue-300 transition font-medium"
                >
                  {crumb.label}
                </Link>
              ) : crumb.href && isLast ? (
                <Link
                  href={crumb.href}
                  className="text-blue-400 hover:text-blue-300 transition"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? "text-zinc-300 font-medium" : "text-zinc-400"}>
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </header>
  );
}
