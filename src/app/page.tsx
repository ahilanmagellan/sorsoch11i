import { Header } from "@/components/header";
import { WorksExplorer } from "@/components/works-explorer";
import { getWorks } from "@/lib/works";
import { QUARTERS, SUBJECTS, WORK_TYPES } from "@/lib/constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ subject?: string | string[]; quarter?: string | string[]; type?: string | string[]; page?: string | string[] }>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const subjectValue = first(params.subject);
  const quarterValue = first(params.quarter);
  const typeValue = first(params.type);
  const requestedPage = Number(first(params.page));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 100_000) : 1;
  const filters = {
    subject: SUBJECTS.includes(subjectValue as (typeof SUBJECTS)[number]) ? subjectValue : "",
    quarter: QUARTERS.some((quarter) => String(quarter) === quarterValue) ? quarterValue : "",
    workType: WORK_TYPES.includes(typeValue as (typeof WORK_TYPES)[number]) ? typeValue : "",
  };
  const result = await getWorks({
    subject: filters.subject || undefined,
    quarter: filters.quarter || undefined,
    work_type: filters.workType || undefined,
  }, page);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <WorksExplorer works={result.works} filters={filters} currentPage={page} totalWorks={result.total} />
      </main>
    </>
  );
}
