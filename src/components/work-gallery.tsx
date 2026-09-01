"use client";

import * as React from "react";
import Image from "next/image";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FolderDown,
  ImageIcon,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function safeFileName(title: string) {
  return title.replace(/[^\p{L}\p{N}_-]+/gu, "_");
}

function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function WorkGallery({ images, title }: { images: string[]; title: string }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [zoomed, setZoomed] = React.useState(false);
  const [downloadingAll, setDownloadingAll] = React.useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600">
        <ImageIcon className="h-12 w-12" />
      </div>
    );
  }

  const current = openIndex !== null ? images[openIndex] : null;

  function openAt(index: number) {
    setZoomed(false);
    setOpenIndex(index);
  }

  function step(delta: number) {
    setZoomed(false);
    setOpenIndex((prev) => {
      if (prev === null) return prev;
      const next = (prev + delta + images.length) % images.length;
      return next;
    });
  }

  async function downloadImage(url: string, index: number) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const extension = blob.type.split("/")[1] ?? "jpg";
      triggerDownload(blob, `${safeFileName(title)}_${index + 1}.${extension}`);
    } catch {
      toast.error("Не удалось скачать фото");
    }
  }

  async function downloadAll() {
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        images.map(async (url, index) => {
          const response = await fetch(url);
          const blob = await response.blob();
          const extension = blob.type.split("/")[1] ?? "jpg";
          zip.file(`${index + 1}.${extension}`, blob);
        })
      );
      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(zipBlob, `${safeFileName(title)}.zip`);
    } catch {
      toast.error("Не удалось скачать фото");
    } finally {
      setDownloadingAll(false);
    }
  }

  return (
    <>
      {images.length > 1 ? (
        <div className="mb-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={downloadAll} disabled={downloadingAll}>
            <FolderDown className="h-4 w-4" />
            {downloadingAll ? "Собираю архив..." : "Скачать все фото"}
          </Button>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => openAt(index)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800"
          >
            <Image
              src={src}
              alt={`${title} — фото ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-4xl border-none bg-black/95 p-0 shadow-none">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {current ? (
            <div className="flex flex-col">
              <div
                className={cn(
                  "relative h-[70vh] w-full overflow-auto",
                  zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                )}
                onClick={() => setZoomed((z) => !z)}
              >
                <div
                  className={cn(
                    "relative mx-auto h-full transition-transform duration-200",
                    zoomed ? "w-[180%]" : "w-full"
                  )}
                >
                  <Image
                    src={current}
                    alt={title}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 bg-black/90 p-3">
                <div className="flex items-center gap-1">
                  {images.length > 1 ? (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => step(-1)} aria-label="Предыдущее фото">
                        <ChevronLeft className="h-5 w-5 text-white" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => step(1)} aria-label="Следующее фото">
                        <ChevronRight className="h-5 w-5 text-white" />
                      </Button>
                    </>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoomed((z) => !z)}
                    aria-label="Увеличить/уменьшить"
                  >
                    {zoomed ? (
                      <ZoomOut className="h-5 w-5 text-white" />
                    ) : (
                      <ZoomIn className="h-5 w-5 text-white" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {images.length > 1 ? (
                    <span className="text-xs text-neutral-300">
                      {openIndex !== null ? openIndex + 1 : 0} / {images.length}
                    </span>
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openIndex !== null && downloadImage(current, openIndex)}
                  >
                    <Download className="h-4 w-4" />
                    Скачать фото
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
