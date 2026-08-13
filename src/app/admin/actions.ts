"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAdminSessionToken, ADMIN_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth";
import { WORK_PHOTOS_BUCKET } from "@/lib/constants";

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

export async function createWorkAction(
  _prevState: CreateWorkState,
  formData: FormData
): Promise<CreateWorkState> {
  const subject = String(formData.get("subject") ?? "").trim();
  const grade = 11;
  const quarter = Number(formData.get("quarter"));
  const workType = String(formData.get("work_type") ?? "").trim();
  const testDate = String(formData.get("test_date") ?? "").trim() || null;

  const maxScoreUnknown = formData.get("max_score_unknown") === "on";
  const variantsUnknown = formData.get("variants_count_unknown") === "on";

  const rawMaxScore = String(formData.get("max_score") ?? "").trim();
  const rawVariants = String(formData.get("variants_count") ?? "").trim();

  const maxScore = maxScoreUnknown || rawMaxScore === "" ? null : Number(rawMaxScore);
  const variantsCount = variantsUnknown || rawVariants === "" ? null : Number(rawVariants);

  const customTitle = String(formData.get("title") ?? "").trim();
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);

  if (!subject || !quarter || !workType) {
    return { error: "Заполните предмет, четверть и тип работы" };
  }

  if (files.length === 0) {
    return { error: "Загрузите хотя бы одно фото работы" };
  }

  const title = customTitle || `${workType} по предмету «${subject}», ${grade} класс, ${quarter} четверть`;

  const supabase = createAdminClient();

  const imageUrls: string[] = [];
  for (const file of files) {
    const rawExtension = file.name.split(".").pop() || "jpg";
    const extension = /^[a-zA-Z0-9]+$/.test(rawExtension) ? rawExtension.toLowerCase() : "jpg";
    const path = `${Date.now()}-${nanoid(10)}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(WORK_PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type || "image/jpeg" });

    if (uploadError) {
      return { error: `Ошибка загрузки фото: ${uploadError.message}` };
    }

    const { data } = supabase.storage.from(WORK_PHOTOS_BUCKET).getPublicUrl(path);
    imageUrls.push(data.publicUrl);
  }

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
  });

  if (insertError) {
    return { error: `Ошибка сохранения: ${insertError.message}` };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteWorkAction(id: string) {
  const supabase = createAdminClient();

  const { data: work } = await supabase.from("works").select("image_urls").eq("id", id).maybeSingle();

  if (work?.image_urls?.length) {
    const paths = work.image_urls
      .map((url: string) => {
        const marker = `/${WORK_PHOTOS_BUCKET}/`;
        const idx = url.indexOf(marker);
        return idx >= 0 ? url.slice(idx + marker.length) : null;
      })
      .filter((p: string | null): p is string => Boolean(p));

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
