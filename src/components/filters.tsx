import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { QUARTERS, SUBJECTS, WORK_TYPES } from "@/lib/constants";

export interface FiltersValue {
  subject: string;
  quarter: string;
  workType: string;
}

export function Filters({ value }: { value: FiltersValue }) {
  const hasAppliedFilters = Boolean(value.subject || value.quarter || value.workType);

  return (
    <form action="/" method="get" className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="subject-filter" className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Предмет
          </label>
          <Select id="subject-filter" name="subject" defaultValue={value.subject}>
            <option value="">Все предметы</option>
            {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
          </Select>
        </div>

        <div>
          <label htmlFor="quarter-filter" className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Четверть
          </label>
          <Select id="quarter-filter" name="quarter" defaultValue={value.quarter}>
            <option value="">Все четверти</option>
            {QUARTERS.map((quarter) => <option key={quarter} value={quarter}>{quarter} четверть</option>)}
          </Select>
        </div>

        <div>
          <label htmlFor="work-type-filter" className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Тип работы
          </label>
          <Select id="work-type-filter" name="type" defaultValue={value.workType}>
            <option value="">Все типы</option>
            {WORK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        {hasAppliedFilters ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <RotateCcw className="h-3.5 w-3.5" />
              Очистить
            </Link>
          </Button>
        ) : null}
        <Button type="submit" size="sm">
          <Check className="h-3.5 w-3.5" />
          Применить фильтры
        </Button>
      </div>
    </form>
  );
}
