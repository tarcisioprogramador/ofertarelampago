"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-flash-600 transition-colors hover:bg-flash-50">
      <LogOut className="size-3.5" aria-hidden />
      Sair
    </button>
  );
}
