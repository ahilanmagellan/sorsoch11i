import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import type { Work, WorkFilters } from "@/lib/types";

export interface WorkListPage {
  works: Work[];
  total: number;
}

export async function getWorks(filters: WorkFilters, page = 1, pageSize = 24): Promise<WorkListPage> {
  const supabase = createServerClient();
  // The catalog needs only card fields. Avoid sending duplicate variant photo URLs
  // to the browser; full work data is loaded only on the detail page.
  let query = supabase
    .from("works")
    .select("id, title, subject, grade, quarter, work_type, test_date, image_urls, max_score, variants_count, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.subject) query = query.eq("subject", filters.subject);
  if (filters.grade) query = query.eq("grade", Number(filters.grade));
  if (filters.quarter) query = query.eq("quarter", Number(filters.quarter));
  if (filters.work_type) query = query.eq("work_type", filters.work_type);
  const safePage = Math.max(1, Math.trunc(page));
  const safePageSize = Math.max(1, Math.min(1000, Math.trunc(pageSize)));
  query = query.range((safePage - 1) * safePageSize, safePage * safePageSize - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("getWorks error:", error.message);
    return { works: [], total: 0 };
  }
  return { works: (data ?? []) as Work[], total: count ?? 0 };
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
