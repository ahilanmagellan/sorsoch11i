"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { QUARTERS, SUBJECTS, WORK_TYPES } from "@/lib/constants";

const FILTER_KEYS = ["subject", "quarter", "work_type"] as const;

export function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const appliedSubject = searchParams.get("subject") ?? "";
  const appliedQuarter = searchParams.get("quarter") ?? "";
  const appliedWorkType = searchParams.get("work_type") ?? "";

  const [subject, setSubject] = React.useState(appliedSubject);
  const [quarter, setQuarter] = React.useState(appliedQuarter);
  const [workType, setWorkType] = React.useState(appliedWorkType);

  const hasAppliedFilters = Boolean(appliedSubject || appliedQuarter || appliedWorkType);
  const hasPendingChanges =
    subject !== appliedSubject || quarter !== appliedQuarter || workType !== appliedWorkType;

  function applyFilters() {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (quarter) params.set("quarter", quarter);
    if (workType) params.set("work_type", workType);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function clearFilters() {
    setSubject("");
    setQuarter("");
    setWorkType("");
    router.push(pathname, { scroll: false });
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Предмет
          </label>
          <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Все предметы</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Четверть
          </label>
          <Select value={quarter} onChange={(e) => setQuarter(e.target.value)}>
            <option value="">Все четверти</option>
            {QUARTERS.map((q) => (
              <option key={q} value={q}>
                {q} четверть
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Тип работы
          </label>
          <Select value={workType} onChange={(e) => setWorkType(e.target.value)}>
            <option value="">Все типы</option>
            {WORK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {hasPendingChanges ? (
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={applyFilters}>
            <Check className="h-3.5 w-3.5" />
            Применить фильтры
          </Button>
        </div>
      ) : hasAppliedFilters ? (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <RotateCcw className="h-3.5 w-3.5" />
            Очистить фильтры
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { FILTER_KEYS };
