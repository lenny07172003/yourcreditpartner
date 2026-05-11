import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPartnerByAuthId, getPartnerReferrals } from "@/lib/supabase/queries";

const STAGE_BADGE: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  booked: "bg-yellow-100 text-yellow-700",
  consulted: "bg-purple-100 text-purple-700",
  closed_won: "bg-success/10 text-success",
  active_service: "bg-success/10 text-success",
  net_revenue_realized: "bg-success/10 text-success",
  refunded: "bg-danger/10 text-danger",
};

export default async function ReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const partner = await getPartnerByAuthId(supabase, user.id);
  if (!partner) redirect("/auth/login");

  const referrals = await getPartnerReferrals(supabase, partner.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Your Referrals</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {referrals.length} referral{referrals.length !== 1 ? "s" : ""} submitted
          </p>
        </div>
        <Link
          href="/dashboard/submit"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
        >
          + Submit Referral
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Booked</th>
              <th className="px-4 py-3">Closed</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-sm text-ink-muted">No referrals yet</p>
                  <Link
                    href="/dashboard/submit"
                    className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
                  >
                    Submit your first referral →
                  </Link>
                </td>
              </tr>
            ) : (
              referrals.map((r) => (
                <tr key={r.id} className="border-t border-line hover:bg-surface-soft">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-ink">
                      {r.client_first_name} {r.client_last_name}
                    </p>
                    <p className="text-xs text-ink-muted">{r.client_email}</p>
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
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {r.booked_at
                      ? new Date(r.booked_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {r.closed_won_at
                      ? new Date(r.closed_won_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
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
