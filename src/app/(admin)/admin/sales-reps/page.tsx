import { createAdminClient } from "@/lib/supabase/admin";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  terminated: "bg-danger/10 text-danger",
};

export default async function AdminSalesRepsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("sales_reps")
    .select("*")
    .is("deleted_at", null)
    .order("last_name");

  const reps = data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Sales Reps / Closers</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {reps.length} rep{reps.length !== 1 ? "s" : ""} configured
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Commission Rate</th>
              <th className="px-4 py-3">Zelle</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {reps.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-muted">
                  No sales reps configured yet.
                </td>
              </tr>
            ) : (
              reps.map((r: any) => (
                <tr key={r.id} className="border-t border-line hover:bg-surface-soft">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-ink">
                      {r.first_name} {r.last_name}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">{r.email}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink">
                    {(r.commission_rate * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {r.zelle_handle || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[r.status] ?? "bg-surface-raised text-ink-muted"}`}
                    >
                      {r.status}
                    </span>
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
