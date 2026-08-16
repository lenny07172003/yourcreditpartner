import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OCG_ORG_ID } from "@/lib/org/context";
import { AddCompanyForm } from "./AddCompanyForm";

export default async function CompaniesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: platformAdmin } = await admin
    .from("platform_admins")
    .select("id")
    .eq("email", user!.email!.toLowerCase())
    .maybeSingle();

  if (!platformAdmin) redirect("/admin");

  const { data: orgs } = await admin
    .from("orgs")
    .select("id, name, plan, included_partner_slots, purchased_additional_slots, admin_email, created_at")
    .eq("kind", "company")
    .neq("id", OCG_ORG_ID)
    .order("created_at", { ascending: false });

  const { data: partnerCounts } = await admin.from("partners").select("org_id").neq("org_id", OCG_ORG_ID);

  const countByOrg = new Map<string, number>();
  for (const row of partnerCounts ?? []) {
    countByOrg.set(row.org_id, (countByOrg.get(row.org_id) ?? 0) + 1);
  }

  const companies = orgs ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-brand-50 p-2.5">
          <Building2 className="size-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Companies</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {companies.length} compan{companies.length === 1 ? "y" : "ies"} sold.
          </p>
        </div>
      </div>

      <AddCompanyForm />

      <div className="rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Admin Email</th>
              <th className="px-4 py-3">Seats</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Sold On</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((org) => {
              const used = countByOrg.get(org.id) ?? 0;
              const limit = org.included_partner_slots + org.purchased_additional_slots;
              const overage = Math.max(0, used - org.included_partner_slots);
              return (
                <tr key={org.id} className="border-t border-line hover:bg-surface-soft">
                  <td className="px-4 py-3 text-sm font-medium text-ink">{org.name}</td>
                  <td className="px-4 py-3 text-sm text-ink-muted">{org.admin_email}</td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {used} / {limit}
                    {overage > 0 && (
                      <span className="ml-2 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
                        +{overage} billable
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-ink-muted">{org.plan}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {companies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-muted">
                  No companies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
