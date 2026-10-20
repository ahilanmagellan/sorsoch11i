import Link from "next/link";
import { Filters, type FiltersValue } from "@/components/filters";
import { WorkGrid } from "@/components/work-grid";
import { Button } from "@/components/ui/button";
import type { Work } from "@/lib/types";

const PAGE_SIZE = 24;

function pageHref(page: number, filters: FiltersValue) {
  const params = new URLSearchParams();
  if (filters.subject) params.set("subject", filters.subject);
  if (filters.quarter) params.set("quarter", filters.quarter);
  if (filters.workType) params.set("type", filters.workType);
  params.set("page", String(page));
  return `/?${params.toString()}`;
}

export function WorksExplorer({
  works,
  filters,
  currentPage,
  totalWorks,
}: {
  works: Work[];
  filters: FiltersValue;
  currentPage: number;
  totalWorks: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalWorks / PAGE_SIZE));

  return (
    <>
      <Filters value={filters} />
      <div className="mt-6">
        <WorkGrid works={works} />
      </div>
      {totalWorks > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Показано {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalWorks)}–{Math.min(currentPage * PAGE_SIZE, totalWorks)} из {totalWorks}
          </p>
          {totalPages > 1 ? (
            <nav aria-label="Страницы работ" className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Button asChild variant="outline" size="sm"><Link href={pageHref(currentPage - 1, filters)}>Назад</Link></Button>
              ) : null}
              <span className="text-sm text-neutral-500 dark:text-neutral-400">{currentPage} / {totalPages}</span>
              {currentPage < totalPages ? (
                <Button asChild variant="outline" size="sm"><Link href={pageHref(currentPage + 1, filters)}>Дальше</Link></Button>
              ) : null}
            </nav>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
