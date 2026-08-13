import { Suspense } from "react";
import { Header } from "@/components/header";
import { Filters } from "@/components/filters";
import { WorkGrid } from "@/components/work-grid";
import { getWorks } from "@/lib/works";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const works = await getWorks({
    subject: firstValue(params.subject),
    grade: firstValue(params.grade),
    quarter: firstValue(params.quarter),
    work_type: firstValue(params.work_type),
  });

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Suspense>
          <Filters />
        </Suspense>
        <div className="mt-6">
          <WorkGrid works={works} />
        </div>
      </main>
    </>
  );
}
