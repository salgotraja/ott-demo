import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchQuery?: string;
  extraParams?: Record<string, string>;
}

function buildUrl(basePath: string, page: number, q?: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v);
    }
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export function PaginationControl({
  currentPage,
  totalPages,
  basePath,
  searchQuery,
  extraParams,
}: PaginationControlProps) {
  if (totalPages <= 1) return null;

  // Build a window of page numbers to show: always show first, last, and
  // a 2-page window around currentPage. Fill gaps with ellipsis.
  const pages: (number | "ellipsis")[] = [];
  const addPage = (n: number) => {
    if (!pages.includes(n)) pages.push(n);
  };

  addPage(1);
  for (let n = Math.max(2, currentPage - 1); n <= Math.min(totalPages - 1, currentPage + 1); n++) {
    addPage(n);
  }
  if (totalPages > 1) addPage(totalPages);

  // Insert ellipsis markers
  const withEllipsis: (number | "ellipsis")[] = [];
  for (let i = 0; i < pages.length; i++) {
    const curr = pages[i] as number;
    if (i > 0) {
      const prev = pages[i - 1] as number;
      if (curr - prev > 1) withEllipsis.push("ellipsis");
    }
    withEllipsis.push(curr);
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={currentPage > 1 ? buildUrl(basePath, currentPage - 1, searchQuery, extraParams) : "#"}
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {withEllipsis.map((item, idx) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href={buildUrl(basePath, item, searchQuery, extraParams)}
                isActive={item === currentPage}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href={currentPage < totalPages ? buildUrl(basePath, currentPage + 1, searchQuery, extraParams) : "#"}
            aria-disabled={currentPage >= totalPages}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
