import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Partner } from "@/types/database";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-success/10 text-success",
    paused: "bg-warning/10 text-warning",
    terminated: "bg-danger/10 text-danger",
  };
  return map[status] ?? "bg-surface-raised text-ink-muted";
}

export default async function AdminPartnersPage() {
  const admin = createAdminClient();

  // Get partners + their referral counts by stage
  const { data: partnersData } = await admin
    .from("partners")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const partners = (partnersData ?? []) as Partner[];

  // Get referral pipeline counts per partner
  const { data: referralsData } = await admin
    .from("referrals")
    .select("partner_id, stage");

  const referrals = referralsData ?? [];

  // Build pipeline map
  const pipelineMap: Record<string, { submitted: number; booked: number; consulted: number; closed: number; total: number }> = {};
  for (const r of referrals) {
    if (!pipelineMap[r.partner_id]) {
      pipelineMap[r.partner_id] = { submitted: 0, booked: 0, consulted: 0, closed: 0, total: 0 };
    }
    pipelineMap[r.partner_id].total++;
    if (r.stage === "submitted") pipelineMap[r.partner_id].submitted++;
    else if (r.stage === "booked") pipelineMap[r.partner_id].booked++;
    else if (r.stage === "consulted") pipelineMap[r.partner_id].consulted++;
    else if (["closed_won", "active_service", "net_revenue_realized"].includes(r.stage)) pipelineMap[r.partner_id].closed++;
  }

  // Get commission totals per partner
  const { data: commissionsData } = await admin
    .from("commissions")
    .select("partner_id, amount_cents")
    .neq("state", "voided");

  const commMap: Record<string, number> = {};
  for (const c of (commissionsData ?? [])) {
    commMap[c.partner_id] = (commMap[c.partner_id] ?? 0) + c.amount_cents;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Partners</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {partners.length} total partner{partners.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Partner</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Submitted</th>
              <th className="px-4 py-3 text-center">Booked</th>
              <th className="px-4 py-3 text-center">Consulted</th>
              <th className="px-4 py-3 text-center">Closed</th>
              <th className="px-4 py-3 text-right">Earnings</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-ink-muted">
                  No partners yet.
                </td>
              </tr>
            )}
            {partners.map((p) => {
              const pl = pipelineMap[p.id] ?? { submitted: 0, booked: 0, consulted: 0, closed: 0, total: 0 };
              const earnings = commMap[p.id] ?? 0;

              return (
                <tr key={p.id} className="border-t border-line hover:bg-surface-soft">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-ink">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-xs text-ink-muted">{p.email}</p>
                    {p.company_name && (
                      <p className="text-xs text-ink-muted">{p.company_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted capitalize">
                    {p.partner_type.replace(/-/g, " ")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-semibold ${pl.submitted > 0 ? "text-blue-600" : "text-ink-muted"}`}>
                      {pl.submitted}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-semibold ${pl.booked > 0 ? "text-yellow-600" : "text-ink-muted"}`}>
                      {pl.booked}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-semibold ${pl.consulted > 0 ? "text-purple-600" : "text-ink-muted"}`}>
                      {pl.consulted}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-semibold ${pl.closed > 0 ? "text-success" : "text-ink-muted"}`}>
                      {pl.closed}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-ink">
                    {earnings > 0 ? `$${(earnings / 100).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {new Date(p.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/partners/${p.id}`}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
