"use client";

import {
  cleanupWorkImageUploadsAction,
  prepareWorkImageUploadsAction,
} from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import { WORK_PHOTOS_BUCKET } from "@/lib/constants";

const MAX_INPUT_SIZE = 30 * 1024 * 1024;
const MAX_OPTIMIZED_SIZE = 15 * 1024 * 1024;
const MAX_EDGE = 2400;
const JPEG_QUALITY = 0.88;
const UPLOAD_CONCURRENCY = 3;

export type SelectedWorkImage = { variant: number; file: File };
export type UploadedWorkImages = Record<number, string[]>;

const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function normalizedType(file: File) {
  if (SUPPORTED_TYPES.has(file.type.toLowerCase())) return file.type.toLowerCase();
  const extension = file.name.split(".").pop()?.toLowerCase();
  const byExtension: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
    gif: "image/gif",
    heic: "image/heic",
    heif: "image/heif",
  };
  return extension ? byExtension[extension] ?? "" : "";
}

function toJpeg(file: File, blob: Blob) {
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: file.lastModified });
}

async function optimizePhoto(file: File) {
  if (file.size > MAX_INPUT_SIZE) {
    throw new Error(`Фото «${file.name}» больше 30 МБ. Уменьшите его размер и попробуйте снова.`);
  }

  const contentType = normalizedType(file);
  if (!contentType) throw new Error(`Не поддерживается формат фото «${file.name}». Используйте JPG, PNG, WebP или HEIC.`);

  const original = () => {
    if (file.size > MAX_OPTIMIZED_SIZE) {
      throw new Error(`Не удалось уменьшить «${file.name}». Сохраните снимок как JPG и попробуйте снова.`);
    }
    return { file, contentType };
  };

  if (file.size <= 700 * 1024) return original();
  if (typeof createImageBitmap === "undefined") return original();

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return original();
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1_200 * 1024) return { file, contentType };

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return original();
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return original();
    const optimized = toJpeg(file, blob);
    if (optimized.size > MAX_OPTIMIZED_SIZE) {
      throw new Error(`Фото «${file.name}» после сжатия всё ещё больше 15 МБ.`);
    }
    return { file: optimized, contentType: "image/jpeg" };
  } finally {
    bitmap.close();
  }
}

export async function uploadSelectedWorkImages(
  selected: SelectedWorkImage[],
  onProgress: (message: string) => void
): Promise<UploadedWorkImages> {
  if (selected.length === 0) return {};
  if (selected.length > 100) throw new Error("Можно загрузить не более 100 фото за раз.");

  const prepared: (SelectedWorkImage & { file: File; contentType: string })[] = [];
  for (const [index, item] of selected.entries()) {
    onProgress(`Подготавливаю фото ${index + 1} из ${selected.length}…`);
    prepared.push({ ...item, ...(await optimizePhoto(item.file)) });
  }

  onProgress("Подключаю защищённую загрузку…");
  const signedResult = await prepareWorkImageUploadsAction(
    prepared.map(({ file, contentType }) => ({ fileName: file.name, contentType }))
  );
  if (signedResult.error || !signedResult.uploads) throw new Error(signedResult.error ?? "Не удалось подготовить загрузку фото.");

  const supabase = createClient();
  const uploadedUrls: string[] = [];
  try {
    for (let offset = 0; offset < prepared.length; offset += UPLOAD_CONCURRENCY) {
      const batch = prepared.slice(offset, offset + UPLOAD_CONCURRENCY);
      const results = await Promise.all(batch.map(async ({ file, contentType }, batchIndex) => {
        const signed = signedResult.uploads![offset + batchIndex];
        const { error } = await supabase.storage.from(WORK_PHOTOS_BUCKET).uploadToSignedUrl(
          signed.path,
          signed.token,
          file,
          { contentType, cacheControl: "31536000" }
        );
        return { error, url: signed.publicUrl };
      }));

      uploadedUrls.push(...results.filter((result) => !result.error).map((result) => result.url));
      const failed = results.find((result) => result.error);
      if (failed?.error) throw new Error(`Не удалось загрузить фото: ${failed.error.message}`);
      onProgress(`Загружено ${Math.min(offset + batch.length, prepared.length)} из ${prepared.length} фото…`);
    }
  } catch (error) {
    await cleanupWorkImageUploadsAction(uploadedUrls);
    throw error;
  }

  return prepared.reduce<UploadedWorkImages>((byVariant, item, index) => {
    (byVariant[item.variant] ??= []).push(signedResult.uploads![index].publicUrl);
    return byVariant;
  }, {});
}

export function addUploadedImagesToFormData(formData: FormData, images: UploadedWorkImages) {
  for (const [variant, urls] of Object.entries(images)) {
    for (const url of urls) formData.append(`variant_image_urls_${variant}`, url);
  }
}

export async function cleanupUploadedWorkImages(images: UploadedWorkImages) {
  await cleanupWorkImageUploadsAction(Object.values(images).flat());
}
