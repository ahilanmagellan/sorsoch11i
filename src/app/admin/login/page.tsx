import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <LoginForm />
    </main>
  );
}
