import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Работа не найдена
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Возможно, она была удалена или ссылка неверна.
        </p>
        <Button asChild className="mt-2">
          <Link href="/">На главную</Link>
        </Button>
      </main>
    </>
  );
}
