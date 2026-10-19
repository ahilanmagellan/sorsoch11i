import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { EditWorkForm } from "@/components/admin/edit-work-form";
import { getWorkById } from "@/lib/works";

export const dynamic = "force-dynamic";

export default async function EditWorkPage({ params }: PageProps<"/admin/works/[id]">) {
  const { id } = await params;
  const work = await getWorkById(id);
  if (!work) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
        <ArrowLeft className="h-4 w-4" /> Назад в админ-панель
      </Link>
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white"><GraduationCap className="h-5 w-5" /></span>
        <div>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Редактировать работу</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{work.title}</p>
        </div>
      </div>
      <EditWorkForm work={work} />
    </main>
  );
}
