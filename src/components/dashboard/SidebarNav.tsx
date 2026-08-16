"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  DollarSign,
  BookOpen,
  Settings,
  ClipboardList,
  Banknote,
  Target,
  TrendingUp,
  Video,
  Trophy,
  Webhook,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const PARTNER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/referrals", label: "Referrals", icon: Users },
  { href: "/dashboard/submit", label: "Submit Referral", icon: UserPlus },
  { href: "/dashboard/commissions", label: "Commissions", icon: DollarSign },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/resources", label: "Resources", icon: BookOpen },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { href: "/admin/companies", label: "Companies", icon: Building2 },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/partners", label: "Partners", icon: Users },
  { href: "/admin/referrals", label: "Referrals", icon: ClipboardList },
  { href: "/admin/payouts", label: "Payouts", icon: Banknote },
  { href: "/admin/sales-reps", label: "Sales Reps", icon: Target },
  { href: "/admin/cashflow", label: "Cashflow", icon: TrendingUp },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/admin/integrations", label: "Integrations", icon: Webhook },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/settings/tiers", label: "Tier Settings", icon: Settings },
];

export function SidebarNav({
  variant,
  isPlatformAdmin = false,
}: {
  variant: "partner" | "admin";
  isPlatformAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items =
    variant === "admin" ? (isPlatformAdmin ? [...ADMIN_NAV, ...SUPER_ADMIN_NAV] : ADMIN_NAV) : PARTNER_NAV;

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            item.href !== "/admin" &&
            pathname.startsWith(item.href + "/"));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-l-2 border-brand-600 bg-brand-50 text-brand-700"
                : "text-ink-muted hover:bg-surface-raised hover:text-ink"
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({
  variant,
  isPlatformAdmin = false,
}: {
  variant: "partner" | "admin";
  isPlatformAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items =
    variant === "admin" ? (isPlatformAdmin ? [...ADMIN_NAV, ...SUPER_ADMIN_NAV] : ADMIN_NAV) : PARTNER_NAV;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-2 py-2 lg:hidden">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            item.href !== "/admin" &&
            pathname.startsWith(item.href + "/"));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-brand-50 text-brand-700"
                : "text-ink-muted hover:bg-surface-raised hover:text-ink"
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
