import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Banknote,
  Target,
  Video,
  Settings,
  TrendingUp,
} from "lucide-react";
import { SidebarNav, MobileNav, type NavItem } from "@/components/dashboard/SidebarNav";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/partners", label: "Partners", icon: Users },
  { href: "/admin/referrals", label: "Referrals", icon: ClipboardList },
  { href: "/admin/payouts", label: "Payouts", icon: Banknote },
  { href: "/admin/sales-reps", label: "Sales Reps", icon: Target },
  { href: "/admin/cashflow", label: "Cashflow", icon: TrendingUp },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/settings/tiers", label: "Tier Settings", icon: Settings },
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

        <SidebarNav items={NAV_ITEMS} />

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

        <MobileNav items={NAV_ITEMS} />

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
