"use client";

import * as React from "react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createWorkAction } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SUBJECTS, QUARTERS, WORK_TYPES } from "@/lib/constants";

export function UploadForm() {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [maxScoreUnknown, setMaxScoreUnknown] = useState(false);
  const [variantsUnknown, setVariantsUnknown] = useState(false);
  const [variantCount, setVariantCount] = useState("");
  const [variantSlots, setVariantSlots] = useState(1);
  const shownVariantCount = variantsUnknown ? variantSlots : Number(variantCount) || 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createWorkAction(null, formData);
      if (result?.success) {
        toast.success("Работа успешно добавлена");
        formRef.current?.reset();
        setMaxScoreUnknown(false);
        setVariantsUnknown(false);
        setVariantCount("");
        setVariantSlots(1);
      } else if (result?.error) {
        toast.error(result.error);
      }
    });
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
            <option value="" disabled>Выберите</option>
            {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
          </Select>
        </Field>
        <Field label="Четверть">
          <Select name="quarter" required defaultValue="">
            <option value="" disabled>Выберите</option>
            {QUARTERS.map((quarter) => <option key={quarter} value={quarter}>{quarter} четверть</option>)}
          </Select>
        </Field>
        <Field label="Тип работы">
          <Select name="work_type" required defaultValue="">
            <option value="" disabled>Выберите</option>
            {WORK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="Название (необязательно)">
        <Input name="title" placeholder="Например: СОР 1 по Биологии, 1 четверть" />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Дата написания"><Input type="date" name="test_date" /></Field>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Максимальный балл</label>
          <Input type="number" name="max_score" min={0} disabled={maxScoreUnknown} />
          <label className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <input type="checkbox" name="max_score_unknown" checked={maxScoreUnknown} onChange={(e) => setMaxScoreUnknown(e.target.checked)} />
            Неизвестно
          </label>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Количество вариантов</label>
          <Input
            type="number"
            name="variants_count"
            min={1}
            max={50}
            value={variantCount}
            disabled={variantsUnknown}
            onChange={(e) => setVariantCount(e.target.value)}
          />
          <label className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <input
              type="checkbox"
              name="variants_count_unknown"
              checked={variantsUnknown}
              onChange={(e) => {
                setVariantsUnknown(e.target.checked);
                if (e.target.checked && variantSlots < 1) setVariantSlots(1);
              }}
            />
            Неизвестно
          </label>
        </div>
      </div>

      {variantsUnknown ? <input type="hidden" name="variant_slot_count" value={variantSlots} /> : null}

      {shownVariantCount > 0 ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Фото по вариантам</h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              В каждом окне можно выбрать несколько страниц. Варианты без фото останутся пустыми.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: Math.min(shownVariantCount, 50) }, (_, index) => {
              const variant = index + 1;
              return (
                <label key={variant} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                  <span className="mb-2 block text-sm font-medium text-neutral-800 dark:text-neutral-200">Вариант {variant}</span>
                  <Input type="file" name={`variant_files_${variant}`} accept="image/*" multiple />
                  <span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">Можно оставить пустым</span>
                </label>
              );
            })}
          </div>
          {variantsUnknown ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setVariantSlots((count) => Math.min(count + 1, 50))} disabled={variantSlots >= 50}>
              Добавить вариант
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-amber-700 dark:text-amber-300">Укажите количество вариантов или отметьте «Неизвестно», чтобы добавить варианты вручную.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Загрузка..." : "Сохранить работу"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>{children}</div>;
}
