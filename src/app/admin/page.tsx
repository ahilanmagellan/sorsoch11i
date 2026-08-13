import { GraduationCap } from "lucide-react";
import { UploadForm } from "@/components/admin/upload-form";
import { WorksTable } from "@/components/admin/works-table";
import { LogoutButton } from "@/components/admin/logout-button";
import { getWorks } from "@/lib/works";

export default async function AdminPage() {
  const works = await getWorks({});

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Админ-панель</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="mb-8">
        <UploadForm />
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Загруженные работы ({works.length})
        </h2>
        <WorksTable works={works} />
      </div>
    </main>
  );
}
