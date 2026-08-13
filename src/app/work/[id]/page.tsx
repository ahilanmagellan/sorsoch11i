import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, ClipboardList, Hash, Layers } from "lucide-react";
import { Header } from "@/components/header";
import { WorkGallery } from "@/components/work-gallery";
import { Badge } from "@/components/ui/badge";
import { getWorkById } from "@/lib/works";
import { WORK_TYPE_BADGE_STYLES, type WorkType } from "@/lib/constants";

function formatDate(value: string | null) {
  if (!value) return "Неизвестно";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(value)
  );
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWorkById(id);

  if (!work) {
    notFound();
  }

  const badgeClass =
    WORK_TYPE_BADGE_STYLES[work.work_type as WorkType] ??
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к списку
        </Link>

        <div className="mb-6">
          <Badge className={badgeClass}>{work.work_type}</Badge>
          <h1 className="mt-2 text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
            {work.title}
          </h1>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoTile icon={<Layers className="h-4 w-4" />} label="Предмет" value={work.subject} />
          <InfoTile icon={<Hash className="h-4 w-4" />} label="Класс / четверть" value={`${work.grade} класс, ${work.quarter} четверть`} />
          <InfoTile
            icon={<ClipboardList className="h-4 w-4" />}
            label="Макс. балл"
            value={work.max_score ?? "Неизвестно"}
          />
          <InfoTile
            icon={<ClipboardList className="h-4 w-4" />}
            label="Кол-во вариантов"
            value={work.variants_count ?? "Неизвестно"}
          />
        </div>

        <div className="mb-6 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <Calendar className="h-4 w-4" />
          Дата написания: {formatDate(work.test_date)}
        </div>

        <WorkGallery images={work.image_urls} title={work.title} />
      </main>
    </>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{value}</div>
    </div>
  );
}
