"use client";

import * as React from "react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { createWorkAction } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SUBJECTS, QUARTERS, WORK_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function UploadForm() {
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [maxScoreUnknown, setMaxScoreUnknown] = useState(false);
  const [variantsUnknown, setVariantsUnknown] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  function updateFileNames(files: FileList | null) {
    setFileNames(files ? Array.from(files).map((f) => f.name) : []);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createWorkAction(null, formData);
      if (result?.success) {
        toast.success("Работа успешно добавлена");
        formRef.current?.reset();
        setFileNames([]);
        setMaxScoreUnknown(false);
        setVariantsUnknown(false);
      } else if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (!fileInputRef.current) return;
    fileInputRef.current.files = e.dataTransfer.files;
    updateFileNames(e.dataTransfer.files);
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Добавить работу</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Предмет">
          <Select name="subject" required defaultValue="">
            <option value="" disabled>
              Выберите
            </option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Четверть">
          <Select name="quarter" required defaultValue="">
            <option value="" disabled>
              Выберите
            </option>
            {QUARTERS.map((q) => (
              <option key={q} value={q}>
                {q} четверть
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Тип работы">
          <Select name="work_type" required defaultValue="">
            <option value="" disabled>
              Выберите
            </option>
            {WORK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Название (необязательно)">
        <Input name="title" placeholder="Например: СОР 1 по Биологии, 1 четверть" />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Дата написания">
          <Input type="date" name="test_date" />
        </Field>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Максимальный балл
          </label>
          <Input type="number" name="max_score" min={0} disabled={maxScoreUnknown} />
          <label className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <input
              type="checkbox"
              name="max_score_unknown"
              checked={maxScoreUnknown}
              onChange={(e) => setMaxScoreUnknown(e.target.checked)}
            />
            Неизвестно
          </label>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Количество вариантов
          </label>
          <Input type="number" name="variants_count" min={0} disabled={variantsUnknown} />
          <label className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <input
              type="checkbox"
              name="variants_count_unknown"
              checked={variantsUnknown}
              onChange={(e) => setVariantsUnknown(e.target.checked)}
            />
            Неизвестно
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Фото работы
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragActive
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
              : "border-neutral-300 dark:border-neutral-700"
          )}
        >
          <UploadCloud className="h-8 w-8 text-neutral-400" />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Перетащите фото сюда или нажмите, чтобы выбрать
          </p>
          {fileNames.length > 0 ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{fileNames.join(", ")}</p>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          name="images"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => updateFileNames(e.target.files)}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Загрузка..." : "Сохранить работу"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>
      {children}
    </div>
  );
}
