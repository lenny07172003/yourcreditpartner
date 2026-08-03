import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { SidebarNav, MobileNav } from "@/components/dashboard/SidebarNav";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Verify admin role
  const admin = createAdminClient();
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("id, role")
    .eq("email", user.email!.toLowerCase())
    .maybeSingle();

  if (!adminUser) redirect("/dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-surface-soft">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-line px-6">
          <Link href="/admin">
            <Image src="/logo.png" alt="YourCreditPartner" width={160} height={40} className="h-8 w-auto" />
          </Link>
        </div>

        <SidebarNav variant="admin" />

        <div className="border-t border-line p-4">
          <div className="rounded-lg bg-surface-raised p-3">
            <p className="text-xs font-medium text-ink-muted">Admin</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-ink">
              {user.email}
            </p>
            <p className="text-xs text-ink-muted capitalize">{adminUser.role}</p>
          </div>
          <Link
            href="/dashboard"
            className="mt-2 block text-center text-xs text-brand-600 hover:underline"
          >
            Switch to Partner View →
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
          <Link href="/admin">
            <Image src="/logo.png" alt="YourCreditPartner" width={160} height={40} className="h-8 w-auto" />
          </Link>
        </header>

        <MobileNav variant="admin" />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
