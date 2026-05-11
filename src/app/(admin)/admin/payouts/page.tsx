"use client";

import { useState, useEffect } from "react";

interface PayoutRow {
  id: string;
  partner_id: string;
  partner_name: string;
  total_cents: number;
  commission_count: number;
  zelle_handle: string;
  status: string;
  created_at: string;
  sent_at: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  queued: "bg-yellow-100 text-yellow-700",
  sent: "bg-blue-100 text-blue-700",
  confirmed: "bg-success/10 text-success",
  failed: "bg-danger/10 text-danger",
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadPayouts() {
    const res = await fetch("/api/admin/payouts");
    if (res.ok) {
      const data = await res.json();
      setPayouts(data.payouts ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPayouts();
  }, []);

  async function createPayoutRun() {
    setCreating(true);
    setMsg(null);
    const res = await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_run" }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`Created ${data.created} payout(s)`);
      loadPayouts();
    } else {
      setMsg(data.error ?? "Failed to create payout run");
    }
    setCreating(false);
  }

  async function markSent(payoutId: string) {
    const res = await fetch(`/api/admin/payouts/${payoutId}/mark-paid`, {
      method: "POST",
    });
    if (res.ok) {
      loadPayouts();
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center text-sm text-ink-muted">
        Loading payouts...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Payouts</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Create payout runs from payable commissions and mark as sent
          </p>
        </div>
        <button
          onClick={createPayoutRun}
          disabled={creating}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Payout Run"}
        </button>
      </div>

      {msg && (
        <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
          {msg}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Partner</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Commissions</th>
              <th className="px-4 py-3">Zelle</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-muted">
                  No payouts yet. Click &ldquo;Create Payout Run&rdquo; to batch payable commissions.
                </td>
              </tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id} className="border-t border-line hover:bg-surface-soft">
                  <td className="px-4 py-3 text-sm font-medium text-ink">
                    {p.partner_name}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink">
                    ${(p.total_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {p.commission_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {p.zelle_handle || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[p.status] ?? "bg-surface-raised text-ink-muted"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {new Date(p.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "queued" && (
                      <button
                        onClick={() => markSent(p.id)}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        Mark Sent
                      </button>
                    )}
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
