import { SearchX } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
      <SearchX className="h-10 w-10 text-neutral-400 dark:text-neutral-600" />
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Ничего не найдено
      </p>
      <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
        Попробуйте изменить параметры поиска.
      </p>
    </div>
  );
}
