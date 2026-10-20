"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateWorkAction } from "@/app/admin/actions";
import { createAdminCommentAction } from "@/app/work/[id]/actions";
import {
  addUploadedImagesToFormData,
  cleanupUploadedWorkImages,
  uploadSelectedWorkImages,
  type UploadedWorkImages,
} from "@/lib/admin-image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { QUARTERS, SUBJECTS, WORK_TYPES } from "@/lib/constants";
import type { ImageVariant, Work } from "@/lib/types";

function normalizeVariants(work: Work): ImageVariant[] {
  if (work.image_variants?.length) return work.image_variants;
  return work.image_urls.length ? [{ variant: 1, image_urls: work.image_urls }] : [{ variant: 1, image_urls: [] }];
}

export function EditWorkForm({ work }: { work: Work }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const variants = normalizeVariants(work);
  const oldImages = variants.flatMap((group) => group.image_urls.map((url) => ({ url, variant: group.variant })));
  const highestVariant = Math.max(1, ...variants.map((group) => group.variant));
  const highestPhotoVariant = Math.max(1, ...oldImages.map((image) => image.variant));
  const [variantsUnknown, setVariantsUnknown] = useState(work.variants_count === null);
  const [variantCount, setVariantCount] = useState(String(work.variants_count ?? highestVariant));
  const [variantSlots, setVariantSlots] = useState(Math.max(highestVariant, work.variants_count ?? 1));
  const [maxScoreUnknown, setMaxScoreUnknown] = useState(work.max_score === null);
  const [uploadProgress, setUploadProgress] = useState("");
  const shownVariantCount = variantsUnknown
    ? variantSlots
    : Math.max(Number(variantCount) || 0, highestPhotoVariant);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const adminComment = String(formData.get("admin_comment") ?? "").trim();
    startTransition(async () => {
      let uploadedImages: UploadedWorkImages = {};
      let workSaved = false;
      try {
        const fileInputs = Array.from(formElement.querySelectorAll<HTMLInputElement>('input[type="file"][name^="variant_files_"]'));
        const selected = fileInputs.flatMap((input) => {
          const variant = Number(input.name.match(/variant_files_(\d+)/)?.[1]);
          return variant ? Array.from(input.files ?? []).map((file) => ({ variant, file })) : [];
        });
        uploadedImages = await uploadSelectedWorkImages(selected, setUploadProgress);
        fileInputs.forEach((input) => formData.delete(input.name));
        addUploadedImagesToFormData(formData, uploadedImages);

        const result = await updateWorkAction(work.id, formData);
        if (result.error) {
          await cleanupUploadedWorkImages(uploadedImages);
          toast.error(result.error);
          return;
        }
        workSaved = true;

        if (adminComment) {
          const commentResult = await createAdminCommentAction(work.id, adminComment);
          if (commentResult.error) {
            toast.error(`Работа сохранена, но комментарий не добавлен: ${commentResult.error}`);
            router.refresh();
            return;
          }
          const commentField = formElement.elements.namedItem("admin_comment");
          if (commentField instanceof HTMLTextAreaElement) commentField.value = "";
        }
        toast.success(adminComment ? "Изменения сохранены, комментарий администратора опубликован" : "Изменения сохранены");
        router.refresh();
      } catch (error) {
        if (!workSaved && Object.keys(uploadedImages).length) await cleanupUploadedWorkImages(uploadedImages);
        toast.error(error instanceof Error ? error.message : "Не удалось сохранить работу. Попробуйте ещё раз.");
      } finally {
        setUploadProgress("");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Предмет">
          <Select name="subject" required defaultValue={work.subject}>
            {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            {!SUBJECTS.includes(work.subject as (typeof SUBJECTS)[number]) ? <option value={work.subject}>{work.subject}</option> : null}
          </Select>
        </Field>
        <Field label="Четверть">
          <Select name="quarter" required defaultValue={work.quarter}>
            {QUARTERS.map((quarter) => <option key={quarter} value={quarter}>{quarter} четверть</option>)}
          </Select>
        </Field>
        <Field label="Тип работы">
          <Select name="work_type" required defaultValue={work.work_type}>
            {WORK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            {!WORK_TYPES.includes(work.work_type as (typeof WORK_TYPES)[number]) ? <option value={work.work_type}>{work.work_type}</option> : null}
          </Select>
        </Field>
      </div>

      <Field label="Название">
        <Input name="title" defaultValue={work.title} placeholder="Название работы" />
      </Field>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Комментарий администратора к работе</span>
        <textarea
          name="admin_comment"
          rows={3}
          maxLength={2000}
          placeholder="Оставьте пояснение или объявление. Пустое поле не добавит комментарий."
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Дата написания"><Input type="date" name="test_date" defaultValue={work.test_date?.slice(0, 10) ?? ""} /></Field>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Максимальный балл</label>
          <Input type="number" name="max_score" min={0} defaultValue={work.max_score ?? ""} disabled={maxScoreUnknown} />
          <label className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <input type="checkbox" name="max_score_unknown" checked={maxScoreUnknown} onChange={(event) => setMaxScoreUnknown(event.target.checked)} />
            Неизвестно
          </label>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Количество вариантов</label>
          <Input type="number" name="variants_count" min={1} max={50} value={variantCount} disabled={variantsUnknown} onChange={(event) => setVariantCount(event.target.value)} />
          <label className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <input
              type="checkbox"
              name="variants_count_unknown"
              checked={variantsUnknown}
              onChange={(event) => {
                setVariantsUnknown(event.target.checked);
                if (event.target.checked) setVariantSlots((count) => Math.max(count, Number(variantCount) || 1));
              }}
            />
            Неизвестно
          </label>
        </div>
      </div>

      {variantsUnknown ? <input type="hidden" name="variant_slot_count" value={variantSlots} /> : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Существующие фото</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Измените номер варианта у старых фото или отметьте фото для удаления.</p>
        </div>
        {oldImages.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {oldImages.map((image, index) => (
              <div key={`${image.url}-${index}`} className="flex gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                  <Image src={image.url} alt={`Фото ${index + 1}`} fill sizes="112px" className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <label className="text-xs text-neutral-500 dark:text-neutral-400">
                    Вариант
                    <Select name={`image_variant_${index}`} defaultValue={image.variant} className="mt-1">
                      {Array.from({ length: Math.min(shownVariantCount, 50) }, (_, variantIndex) => variantIndex + 1).map((variant) => (
                        <option key={variant} value={variant}>{variant}</option>
                      ))}
                    </Select>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                    <input type="checkbox" name={`remove_image_${index}`} /> Удалить фото
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Старых фотографий нет.</p>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Добавить фото по вариантам</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Можно добавить несколько страниц в каждый вариант, а ненужные окна оставить пустыми.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: Math.min(shownVariantCount, 50) }, (_, index) => {
            const variant = index + 1;
            return (
              <label key={variant} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                <span className="mb-2 block text-sm font-medium text-neutral-800 dark:text-neutral-200">Новые фото — вариант {variant}</span>
                <Input type="file" name={`variant_files_${variant}`} accept="image/*" multiple />
              </label>
            );
          })}
        </div>
        {variantsUnknown ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setVariantSlots((count) => Math.min(count + 1, 50))} disabled={variantSlots >= 50}>
            Добавить вариант
          </Button>
        ) : null}
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin")}>Отмена</Button>
        <Button type="submit" disabled={pending}>{pending ? uploadProgress || "Сохранение..." : "Сохранить изменения"}</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>{children}</div>;
}
