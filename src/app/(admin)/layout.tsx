import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/partners", label: "Partners", icon: "👥" },
  { href: "/admin/referrals", label: "Referrals", icon: "📋" },
  { href: "/admin/payouts", label: "Payouts", icon: "💸" },
  { href: "/admin/sales-reps", label: "Sales Reps", icon: "🎯" },
  { href: "/admin/videos", label: "Videos", icon: "🎬" },
  { href: "/admin/settings/tiers", label: "Tier Settings", icon: "⚙️" },
];

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
    <div className="flex min-h-screen bg-surface-soft">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-6">
          <Link href="/admin">
            <Image src="/logo.png" alt="YourCreditPartner" width={160} height={40} className="h-8 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

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
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
          <Link href="/admin">
            <Image src="/logo.png" alt="YourCreditPartner" width={160} height={40} className="h-8 w-auto" />
          </Link>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-2 py-2 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-none rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
