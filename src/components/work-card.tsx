"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ImageIcon, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WORK_TYPE_BADGE_STYLES, type WorkType } from "@/lib/constants";
import type { Work } from "@/lib/types";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(value)
  );
}

export function WorkCard({ work, index = 0 }: { work: Work; index?: number }) {
  const cover = work.image_urls?.[0];
  const date = formatDate(work.test_date);
  const badgeClass =
    WORK_TYPE_BADGE_STYLES[work.work_type as WorkType] ??
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
    >
      <Link
        href={`/work/${work.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {cover ? (
            <Image
              src={cover}
              alt={work.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-300 dark:text-neutral-600">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
          <Badge className={`absolute left-2 top-2 ${badgeClass}`}>{work.work_type}</Badge>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            {work.title}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {work.subject} · {work.grade} класс · {work.quarter} четверть
          </p>
          {date ? (
            <p className="mt-auto flex items-center gap-1 pt-1 text-xs text-neutral-400 dark:text-neutral-500">
              <Calendar className="h-3 w-3" />
              {date}
            </p>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}
