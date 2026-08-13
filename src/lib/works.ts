import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import type { Work, WorkFilters } from "@/lib/types";

export async function getWorks(filters: WorkFilters): Promise<Work[]> {
  const supabase = createServerClient();
  let query = supabase.from("works").select("*").order("created_at", { ascending: false });

  if (filters.subject) query = query.eq("subject", filters.subject);
  if (filters.grade) query = query.eq("grade", Number(filters.grade));
  if (filters.quarter) query = query.eq("quarter", Number(filters.quarter));
  if (filters.work_type) query = query.eq("work_type", filters.work_type);

  const { data, error } = await query;
  if (error) {
    console.error("getWorks error:", error.message);
    return [];
  }
  return data as Work[];
}

export async function getWorkById(id: string): Promise<Work | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("works").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("getWorkById error:", error.message);
    return null;
  }
  return data as Work | null;
}
