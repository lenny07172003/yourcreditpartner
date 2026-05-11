import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

const STAGE_BADGE: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  booked: "bg-yellow-100 text-yellow-700",
  consulted: "bg-purple-100 text-purple-700",
  closed_won: "bg-success/10 text-success",
  active_service: "bg-success/10 text-success",
  net_revenue_realized: "bg-success/10 text-success",
  refunded: "bg-danger/10 text-danger",
};

export default async function AdminReferralsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("referrals")
    .select("*, partners!inner(first_name, last_name, partner_slug)")
    .order("created_at", { ascending: false })
    .limit(100);

  const referrals = data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">All Referrals</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {referrals.length} referral{referrals.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Partner</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-muted">
                  No referrals yet.
                </td>
              </tr>
            ) : (
              referrals.map((r: any) => (
                <tr key={r.id} className="border-t border-line hover:bg-surface-soft">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-ink">
                      {r.client_first_name} {r.client_last_name}
                    </p>
                    <p className="text-xs text-ink-muted">{r.client_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/partners/${r.partner_id}`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      {r.partners?.first_name} {r.partners?.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STAGE_BADGE[r.stage] ?? "bg-surface-raised text-ink-muted"}`}
                    >
                      {r.stage.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {r.gross_revenue_cents
                      ? `$${(r.gross_revenue_cents / 100).toFixed(2)}`
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
