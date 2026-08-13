"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { QUARTERS, SUBJECTS, WORK_TYPES } from "@/lib/constants";

const FILTER_KEYS = ["subject", "quarter", "work_type"] as const;

export function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const subject = searchParams.get("subject") ?? "";
  const quarter = searchParams.get("quarter") ?? "";
  const workType = searchParams.get("work_type") ?? "";

  const hasActiveFilters = subject || quarter || workType;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function resetFilters() {
    router.push(pathname, { scroll: false });
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Предмет
          </label>
          <Select value={subject} onChange={(e) => updateParam("subject", e.target.value)}>
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
          <Select value={quarter} onChange={(e) => updateParam("quarter", e.target.value)}>
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
          <Select value={workType} onChange={(e) => updateParam("work_type", e.target.value)}>
            <option value="">Все типы</option>
            {WORK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-3.5 w-3.5" />
            Сбросить фильтры
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { FILTER_KEYS };
