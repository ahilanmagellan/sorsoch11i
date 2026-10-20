import { EmptyState } from "@/components/empty-state";
import { WorkCard } from "@/components/work-card";
import type { Work } from "@/lib/types";

export function WorkGrid({ works }: { works: Work[] }) {
  if (works.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {works.map((work) => (
        <WorkCard key={work.id} work={work} />
      ))}
    </div>
  );
}
