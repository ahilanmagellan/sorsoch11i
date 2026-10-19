"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
  ADMIN_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth";
import { WORK_PHOTOS_BUCKET } from "@/lib/constants";
import type { ImageVariant } from "@/lib/types";

const MAX_VARIANTS = 50;

function parseVariantCount(formData: FormData) {
  const unknown = formData.get("variants_count_unknown") === "on";
  const rawCount = Number(formData.get("variants_count"));
  const rawSlots = Number(formData.get("variant_slot_count"));
  const count = unknown ? rawSlots : rawCount;
  if (!Number.isInteger(count) || count < 1 || count > MAX_VARIANTS) return null;
  return { unknown, count, storedCount: unknown ? null : rawCount };
}

function uploadedFiles(formData: FormData, variant: number) {
  return formData
    .getAll(`variant_files_${variant}`)
    .filter((file): file is File => file instanceof File && file.size > 0);
}

async function uploadVariantFiles(supabase: ReturnType<typeof createAdminClient>, variant: number, files: File[]) {
  const imageUrls: string[] = [];
  for (const file of files) {
    const rawExtension = file.name.split(".").pop() || "jpg";
    const extension = /^[a-zA-Z0-9]+$/.test(rawExtension) ? rawExtension.toLowerCase() : "jpg";
    const path = `${Date.now()}-${nanoid(10)}.${extension}`;
    const { error } = await supabase.storage.from(WORK_PHOTOS_BUCKET).upload(path, file, {
      contentType: file.type || "image/jpeg",
    });
    if (error) return { error: `Ошибка загрузки фото варианта ${variant}: ${error.message}` };
    const { data } = supabase.storage.from(WORK_PHOTOS_BUCKET).getPublicUrl(path);
    imageUrls.push(data.publicUrl);
  }
  return { imageUrls };
}

function getImagePath(url: string) {
  const marker = `/${WORK_PHOTOS_BUCKET}/`;
  const index = url.indexOf(marker);
  return index >= 0 ? url.slice(index + marker.length) : null;
}

export type ActionState = { error?: string } | null;

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");

  if (!process.env.ADMIN_PASSWORD) {
    return { error: "ADMIN_PASSWORD не настроен на сервере" };
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: "Неверный пароль" };
  }

  const token = await createAdminSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

export type CreateWorkState = { error?: string; success?: boolean } | null;

async function hasAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function createWorkAction(
  _prevState: CreateWorkState,
  formData: FormData
): Promise<CreateWorkState> {
  if (!(await hasAdminSession())) return { error: "Требуется вход администратора" };

  const subject = String(formData.get("subject") ?? "").trim();
  const grade = 11;
  const quarter = Number(formData.get("quarter"));
  const workType = String(formData.get("work_type") ?? "").trim();
  const testDate = String(formData.get("test_date") ?? "").trim() || null;

  const maxScoreUnknown = formData.get("max_score_unknown") === "on";
  const variantCount = parseVariantCount(formData);

  const rawMaxScore = String(formData.get("max_score") ?? "").trim();
  const maxScore = maxScoreUnknown || rawMaxScore === "" ? null : Number(rawMaxScore);
  const variantsCount = variantCount?.storedCount ?? null;

  const customTitle = String(formData.get("title") ?? "").trim();
  if (!subject || !quarter || !workType || !variantCount) {
    return { error: "Заполните предмет, четверть, тип и количество вариантов" };
  }

  const title = customTitle || `${workType} по предмету «${subject}», ${grade} класс, ${quarter} четверть`;

  const supabase = createAdminClient();
  const imageVariants: ImageVariant[] = [];
  for (let variant = 1; variant <= variantCount.count; variant += 1) {
    const uploaded = await uploadVariantFiles(supabase, variant, uploadedFiles(formData, variant));
    if (uploaded.error) return { error: uploaded.error };
    imageVariants.push({ variant, image_urls: uploaded.imageUrls ?? [] });
  }

  const imageUrls = imageVariants.flatMap((item) => item.image_urls);
  if (imageUrls.length === 0) return { error: "Загрузите хотя бы одно фото работы" };

  const { error: insertError } = await supabase.from("works").insert({
    title,
    subject,
    grade,
    quarter,
    work_type: workType,
    max_score: maxScore,
    variants_count: variantsCount,
    test_date: testDate,
    image_urls: imageUrls,
    image_variants: imageVariants,
  });

  if (insertError) {
    return { error: `Ошибка сохранения: ${insertError.message}` };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateWorkAction(id: string, formData: FormData) {
  if (!(await hasAdminSession())) return { error: "Требуется вход администратора" };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Некорректная работа" };

  const subject = String(formData.get("subject") ?? "").trim();
  const quarter = Number(formData.get("quarter"));
  const workType = String(formData.get("work_type") ?? "").trim();
  const testDate = String(formData.get("test_date") ?? "").trim() || null;
  const customTitle = String(formData.get("title") ?? "").trim();
  const maxScoreUnknown = formData.get("max_score_unknown") === "on";
  const rawMaxScore = String(formData.get("max_score") ?? "").trim();
  const maxScore = maxScoreUnknown || rawMaxScore === "" ? null : Number(rawMaxScore);
  const variantCount = parseVariantCount(formData);

  if (!subject || !Number.isInteger(quarter) || quarter < 1 || quarter > 4 || !workType || !variantCount) {
    return { error: "Проверьте предмет, четверть, тип и количество вариантов" };
  }
  if (maxScore !== null && (!Number.isInteger(maxScore) || maxScore < 0)) {
    return { error: "Максимальный балл должен быть целым неотрицательным числом" };
  }

  const supabase = createAdminClient();
  const { data: current, error: readError } = await supabase
    .from("works")
    .select("image_urls, image_variants")
    .eq("id", id)
    .maybeSingle();
  if (readError) {
    if (readError.code === "42703" || readError.message.includes("image_variants")) {
      return {
        error: "База данных ещё не обновлена для вариантов. Выполните SQL-миграцию supabase/variants.sql в Supabase → SQL Editor.",
      };
    }
    return { error: `Не удалось проверить работу в базе данных: ${readError.message}` };
  }
  if (!current) return { error: "Работа не найдена" };

  const oldVariants: ImageVariant[] = Array.isArray(current.image_variants)
    ? (current.image_variants as unknown as ImageVariant[])
    : [];
  const legacyImageUrls: string[] = Array.isArray(current.image_urls)
    ? current.image_urls.filter((url: unknown): url is string => typeof url === "string")
    : [];
  const oldImages: { url: string; variant: number }[] = oldVariants.length
    ? oldVariants.flatMap((item) =>
        (Array.isArray(item.image_urls) ? item.image_urls : [])
          .filter((url): url is string => typeof url === "string")
          .map((url) => ({ url, variant: item.variant }))
      )
    : legacyImageUrls.map((url) => ({ url, variant: 1 }));

  const imageVariants: ImageVariant[] = Array.from({ length: variantCount.count }, (_, index) => ({
    variant: index + 1,
    image_urls: [],
  }));
  const removedImageUrls: string[] = [];

  for (const [index, image] of oldImages.entries()) {
    if (formData.get(`remove_image_${index}`) === "on") {
      removedImageUrls.push(image.url);
      continue;
    }
    const assignedVariant = Number(formData.get(`image_variant_${index}`) ?? image.variant);
    if (!Number.isInteger(assignedVariant) || assignedVariant < 1 || assignedVariant > variantCount.count) {
      return { error: `Выберите допустимый вариант для фото ${index + 1}` };
    }
    imageVariants[assignedVariant - 1].image_urls.push(image.url);
  }

  for (let variant = 1; variant <= variantCount.count; variant += 1) {
    const uploaded = await uploadVariantFiles(supabase, variant, uploadedFiles(formData, variant));
    if (uploaded.error) return { error: uploaded.error };
    imageVariants[variant - 1].image_urls.push(...(uploaded.imageUrls ?? []));
  }

  const imageUrls = imageVariants.flatMap((item) => item.image_urls);
  if (imageUrls.length === 0) return { error: "У работы должно остаться хотя бы одно фото" };

  const title = customTitle || `${workType} по предмету «${subject}», 11 класс, ${quarter} четверть`;
  const { error: updateError } = await supabase
    .from("works")
    .update({
      title,
      subject,
      quarter,
      work_type: workType,
      max_score: maxScore,
      variants_count: variantCount.storedCount,
      test_date: testDate,
      image_urls: imageUrls,
      image_variants: imageVariants,
    })
    .eq("id", id);

  if (updateError) return { error: `Не удалось сохранить изменения: ${updateError.message}` };

  const removedPaths = removedImageUrls.map(getImagePath).filter((path): path is string => Boolean(path));
  if (removedPaths.length) await supabase.storage.from(WORK_PHOTOS_BUCKET).remove(removedPaths);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/works/${id}`);
  revalidatePath(`/work/${id}`);
  return { success: true };
}

export async function deleteWorkAction(id: string) {
  if (!(await hasAdminSession())) throw new Error("Требуется вход администратора");

  const supabase = createAdminClient();

  const { data: work } = await supabase.from("works").select("image_urls").eq("id", id).maybeSingle();

  if (work?.image_urls?.length) {
    const paths = work.image_urls
      .map((url: string) => getImagePath(url))
      .filter((path: string | null): path is string => Boolean(path));

    if (paths.length) {
      await supabase.storage.from(WORK_PHOTOS_BUCKET).remove(paths);
    }
  }

  const { error } = await supabase.from("works").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}
