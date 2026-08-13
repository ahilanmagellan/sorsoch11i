export const SUBJECTS = [
  "Алгебра",
  "Геометрия",
  "Физика",
  "Химия",
  "Биология",
  "География",
  "Информатика",
  "Литература",
  "Русский язык",
  "Английский язык",
  "Казахский язык",
  "История Казахстана",
  "Всемирная история",
  "Основы права",
  "Другое",
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const GRADES = Array.from({ length: 11 }, (_, i) => i + 1);

export const QUARTERS = [1, 2, 3, 4] as const;

export const WORK_TYPES = ["СОР 1", "СОР 2", "СОР 3", "СОЧ", "ФО"] as const;

export type WorkType = (typeof WORK_TYPES)[number];

export const WORK_TYPE_BADGE_STYLES: Record<WorkType, string> = {
  "СОР 1": "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "СОР 2": "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  "СОР 3": "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "СОЧ": "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  "ФО": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export const WORK_PHOTOS_BUCKET = "work-photos";

export const ADMIN_COOKIE_NAME = "admin_session";
