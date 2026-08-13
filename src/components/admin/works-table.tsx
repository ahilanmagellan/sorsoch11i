import Link from "next/link";
import { DeleteWorkButton } from "@/components/admin/delete-work-button";
import type { Work } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(value)
  );
}

export function WorksTable({ works }: { works: Work[] }) {
  if (works.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        Работ пока нет — добавьте первую с помощью формы выше.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th className="px-4 py-3">Название</th>
            <th className="px-4 py-3">Предмет</th>
            <th className="px-4 py-3">Класс</th>
            <th className="px-4 py-3">Четверть</th>
            <th className="px-4 py-3">Тип</th>
            <th className="px-4 py-3">Загружено</th>
            <th className="px-4 py-3 text-right">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {works.map((work) => (
            <tr key={work.id} className="bg-white dark:bg-neutral-950">
              <td className="max-w-xs truncate px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                <Link href={`/work/${work.id}`} className="hover:underline" target="_blank">
                  {work.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{work.subject}</td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{work.grade}</td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{work.quarter}</td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{work.work_type}</td>
              <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{formatDate(work.created_at)}</td>
              <td className="px-4 py-3 text-right">
                <DeleteWorkButton id={work.id} title={work.title} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
