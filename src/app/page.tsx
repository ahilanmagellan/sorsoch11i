import { Header } from "@/components/header";
import { WorksExplorer } from "@/components/works-explorer";
import { getWorks } from "@/lib/works";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const works = await getWorks({});

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <WorksExplorer works={works} />
      </main>
    </>
  );
}
