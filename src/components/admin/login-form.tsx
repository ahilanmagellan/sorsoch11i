"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { loginAction, type ActionState } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, null);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Вход в админ-панель</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Введите пароль администратора
        </p>
      </div>

      <Input type="password" name="password" placeholder="Пароль" autoFocus required />

      {state?.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Проверка..." : "Войти"}
      </Button>
    </form>
  );
}
