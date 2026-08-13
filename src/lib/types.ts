import type { Subject, WorkType } from "@/lib/constants";

export interface Work {
  id: string;
  title: string;
  subject: Subject | string;
  grade: number;
  quarter: number;
  work_type: WorkType | string;
  max_score: number | null;
  variants_count: number | null;
  test_date: string | null;
  image_urls: string[];
  created_at: string;
}

export interface WorkFilters {
  subject?: string;
  grade?: string;
  quarter?: string;
  work_type?: string;
}

export interface NewWorkInput {
  title?: string;
  subject: string;
  grade: number;
  quarter: number;
  work_type: string;
  max_score: number | null;
  variants_count: number | null;
  test_date: string | null;
}
