"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink disabled:opacity-50"
    >
      <LogOut className="size-3.5" />
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
