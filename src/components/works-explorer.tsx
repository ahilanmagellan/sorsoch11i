"use client";

import * as React from "react";
import { Filters, type FiltersValue } from "@/components/filters";
import { WorkGrid } from "@/components/work-grid";
import type { Work } from "@/lib/types";

const EMPTY_FILTERS: FiltersValue = { subject: "", quarter: "", workType: "" };

export function WorksExplorer({ works }: { works: Work[] }) {
  const [pending, setPending] = React.useState<FiltersValue>(EMPTY_FILTERS);
  const [applied, setApplied] = React.useState<FiltersValue>(EMPTY_FILTERS);

  const hasPendingChanges =
    pending.subject !== applied.subject ||
    pending.quarter !== applied.quarter ||
    pending.workType !== applied.workType;

  const hasAppliedFilters = Boolean(applied.subject || applied.quarter || applied.workType);

  const filteredWorks = React.useMemo(() => {
    return works.filter((work) => {
      if (applied.subject && work.subject !== applied.subject) return false;
      if (applied.quarter && String(work.quarter) !== applied.quarter) return false;
      if (applied.workType && work.work_type !== applied.workType) return false;
      return true;
    });
  }, [works, applied]);

  return (
    <>
      <Filters
        value={pending}
        onChange={setPending}
        hasPendingChanges={hasPendingChanges}
        hasAppliedFilters={hasAppliedFilters}
        onApply={() => setApplied(pending)}
        onClear={() => {
          setPending(EMPTY_FILTERS);
          setApplied(EMPTY_FILTERS);
        }}
      />
      <div className="mt-6">
        <WorkGrid works={filteredWorks} />
      </div>
    </>
  );
}
