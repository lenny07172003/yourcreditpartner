"use client";

import { useState, useEffect } from "react";
import { Banknote } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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
    const res = await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_run" }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Created ${data.created} payout(s)`);
      loadPayouts();
    } else {
      toast.error(data.error ?? "Failed to create payout run");
    }
    setCreating(false);
  }

  async function markSent(payout: PayoutRow) {
    const res = await fetch(`/api/admin/payouts/${payout.id}/mark-paid`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success(`Payout to ${payout.partner_name} marked as sent`);
      loadPayouts();
    } else {
      toast.error("Failed to mark payout as sent");
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
        <Button
          onClick={createPayoutRun}
          disabled={creating}
        >
          <Banknote className="size-4" />
          {creating ? "Creating..." : "Create Payout Run"}
        </Button>
      </div>

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
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-3 rounded-xl bg-surface-raised p-3">
                      <Banknote className="size-8 text-ink-muted" />
                    </div>
                    <p className="text-sm font-semibold text-ink">No payouts yet</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Click &ldquo;Create Payout Run&rdquo; to batch payable commissions
                    </p>
                  </div>
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
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {new Date(p.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "queued" && (
                      <AlertDialog>
                        <AlertDialogTrigger className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-brand-400 hover:text-brand-600">
                            Mark Sent
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mark payout as sent?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will mark the ${(p.total_cents / 100).toFixed(2)} payout to{" "}
                              <strong>{p.partner_name}</strong> as sent via Zelle
                              {p.zelle_handle ? ` to ${p.zelle_handle}` : ""}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => markSent(p)}>
                              Yes, Mark as Sent
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
