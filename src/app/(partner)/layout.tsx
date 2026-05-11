import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getPartnerByAuthId } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import { SidebarNav, MobileNav } from "@/components/dashboard/SidebarNav";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const partner = await getPartnerByAuthId(supabase, user.id);
  if (!partner) redirect("/auth/login");

  return (
    <div className="flex min-h-screen bg-surface-soft">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-6">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="YourCreditPartner" width={160} height={40} className="h-8 w-auto" />
          </Link>
        </div>

        <SidebarNav variant="partner" />

        <div className="border-t border-line p-4">
          <div className="rounded-lg bg-surface-raised p-3">
            <p className="text-xs font-medium text-ink-muted">Signed in as</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-ink">
              {partner.first_name} {partner.last_name}
            </p>
            <p className="truncate text-xs text-ink-muted">{partner.email}</p>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="YourCreditPartner" width={160} height={40} className="h-8 w-auto" />
          </Link>
          <p className="text-sm text-ink-muted">{partner.first_name}</p>
        </header>

        {/* Mobile nav */}
        <MobileNav variant="partner" />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
