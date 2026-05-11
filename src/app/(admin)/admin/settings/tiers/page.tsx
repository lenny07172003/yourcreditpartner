import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminTierSettingsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("commission_tiers")
    .select("*")
    .order("tier_number");

  const tiers = data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Commission Tiers</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Configure commission rates and tier thresholds
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Closes Required</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Mechanic</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t: any) => (
              <tr key={t.id} className="border-t border-line hover:bg-surface-soft">
                <td className="px-4 py-3 text-sm font-bold text-brand-600">
                  {t.tier_number}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-ink">
                  {t.display_name}
                </td>
                <td className="px-4 py-3 text-sm text-ink-muted">
                  {t.min_closes}–{t.max_closes ?? "∞"}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-ink">
                  {(t.rate * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted capitalize">
                  {t.mechanic}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      t.active
                        ? "bg-success/10 text-success"
                        : "bg-surface-raised text-ink-muted"
                    }`}
                  >
                    {t.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-line bg-surface-soft p-4">
        <p className="text-xs text-ink-muted">
          <strong className="text-ink">Retroactive mechanic:</strong> When a partner
          crosses a tier threshold mid-month, ALL their closes for that month
          recalculate at the higher rate.
        </p>
      </div>
    </div>
  );
}
