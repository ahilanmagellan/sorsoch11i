"use client";

import { Check, RotateCcw } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { QUARTERS, SUBJECTS, WORK_TYPES } from "@/lib/constants";

export interface FiltersValue {
  subject: string;
  quarter: string;
  workType: string;
}

interface FiltersProps {
  value: FiltersValue;
  onChange: (value: FiltersValue) => void;
  hasPendingChanges: boolean;
  hasAppliedFilters: boolean;
  onApply: () => void;
  onClear: () => void;
}

export function Filters({ value, onChange, hasPendingChanges, hasAppliedFilters, onApply, onClear }: FiltersProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Предмет
          </label>
          <Select
            value={value.subject}
            onChange={(e) => onChange({ ...value, subject: e.target.value })}
          >
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
          <Select
            value={value.quarter}
            onChange={(e) => onChange({ ...value, quarter: e.target.value })}
          >
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
          <Select
            value={value.workType}
            onChange={(e) => onChange({ ...value, workType: e.target.value })}
          >
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
          <Button size="sm" onClick={onApply}>
            <Check className="h-3.5 w-3.5" />
            Применить фильтры
          </Button>
        </div>
      ) : hasAppliedFilters ? (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClear}>
            <RotateCcw className="h-3.5 w-3.5" />
            Очистить фильтры
          </Button>
        </div>
      ) : null}
    </div>
  );
}
