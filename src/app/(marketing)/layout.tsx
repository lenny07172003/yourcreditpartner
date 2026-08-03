import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerByAuthId } from "@/lib/supabase/queries";
import { OCG_ORG_ID } from "@/lib/org/context";
import { SiteNav } from "@/components/marketing/SiteNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";

async function getDashboardHref(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const partner = await getPartnerByAuthId(supabase, user.id, OCG_ORG_ID);
  if (partner) return "/dashboard";

  const admin = createAdminClient();
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("id")
    .eq("email", user.email!.toLowerCase())
    .maybeSingle();
  if (adminUser) return "/admin";

  return null;
}

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dashboardHref = await getDashboardHref();

  return (
    <>
      <SiteNav dashboardHref={dashboardHref} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
