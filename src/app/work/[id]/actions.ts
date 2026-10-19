"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Vote = "like" | "dislike";

function validUuid(value: string) {
  return UUID_PATTERN.test(value);
}

async function isAdmin() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function createCommentAction(
  workId: string,
  authorName: string,
  body: string
): Promise<{ error?: string; success?: boolean }> {
  if (!validUuid(workId)) return { error: "Некорректная работа" };

  const cleanName = authorName.trim().slice(0, 40);
  const cleanBody = body.trim();
  if (cleanBody.length < 1 || cleanBody.length > 2000) {
    return { error: "Комментарий должен содержать от 1 до 2000 символов" };
  }

  const admin = await isAdmin();
  const supabase = admin ? createAdminClient() : createServerClient();
  const { error } = await supabase.from("work_comments").insert({
    work_id: workId,
    author_name: cleanName,
    body: cleanBody,
    is_admin: admin,
  });

  if (error) return { error: "Не удалось сохранить комментарий" };
  revalidatePath(`/work/${workId}`);
  return { success: true };
}

export async function setWorkVoteAction(
  workId: string,
  voterId: string,
  vote: Vote | null
): Promise<{ error?: string }> {
  if (!validUuid(workId) || !validUuid(voterId) || (vote !== null && vote !== "like" && vote !== "dislike")) {
    return { error: "Некорректный голос" };
  }

  const supabase = createServerClient();
  const query = supabase.from("work_votes");
  const result = vote
    ? await query.upsert({ work_id: workId, voter_id: voterId, vote }, { onConflict: "work_id,voter_id" })
    : await query.delete().eq("work_id", workId).eq("voter_id", voterId);

  if (result.error) return { error: "Не удалось сохранить голос" };
  revalidatePath(`/work/${workId}`);
  return {};
}

export async function setCommentVoteAction(
  workId: string,
  commentId: string,
  voterId: string,
  vote: Vote | null
): Promise<{ error?: string }> {
  if (
    !validUuid(workId) ||
    !validUuid(commentId) ||
    !validUuid(voterId) ||
    (vote !== null && vote !== "like" && vote !== "dislike")
  ) {
    return { error: "Некорректный голос" };
  }

  const supabase = createServerClient();
  const query = supabase.from("comment_votes");
  const result = vote
    ? await query.upsert({ comment_id: commentId, voter_id: voterId, vote }, { onConflict: "comment_id,voter_id" })
    : await query.delete().eq("comment_id", commentId).eq("voter_id", voterId);

  if (result.error) return { error: "Не удалось сохранить голос" };
  revalidatePath(`/work/${workId}`);
  return {};
}
