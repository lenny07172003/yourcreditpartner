"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

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

export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

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
