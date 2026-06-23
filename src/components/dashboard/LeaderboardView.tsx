"use client";

import { useMemo, useState } from "react";
import { Crown, ShieldCheck, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getLeaderboardRank, getLeaderboardValue, sortLeaderboard } from "@/lib/leaderboard/rankings";
import type { LeaderboardEntry, LeaderboardMetric, LeaderboardOptIn, LeaderboardPeriod } from "@/lib/leaderboard/types";

type Props = {
  partnerId: string;
  partnerName: string;
  optIn: LeaderboardOptIn | null;
  monthEntries: LeaderboardEntry[];
  allTimeEntries: LeaderboardEntry[];
  topN: number;
};

const periodLabels: Record<LeaderboardPeriod, string> = {
  month: "This month",
  all_time: "All time",
};

const metricLabels: Record<LeaderboardMetric, string> = {
  submissions: "Submissions",
  closes: "Closed deals",
};

function rankClass(rank: number) {
  if (rank === 1) return "bg-amber-100 text-amber-700";
  if (rank === 2) return "bg-slate-200 text-slate-700";
  if (rank === 3) return "bg-orange-100 text-orange-700";
  return "bg-surface-raised text-ink-muted";
}

export function LeaderboardView({ partnerId, partnerName, optIn: initialOptIn, monthEntries, allTimeEntries, topN }: Props) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("month");
  const [metric, setMetric] = useState<LeaderboardMetric>("submissions");
  const [optIn, setOptIn] = useState(initialOptIn);
  const [displayName, setDisplayName] = useState(initialOptIn?.display_name ?? partnerName);
  const [showCompany, setShowCompany] = useState(initialOptIn?.show_company ?? false);
  const [saving, setSaving] = useState(false);

  const entries = period === "month" ? monthEntries : allTimeEntries;
  const sorted = useMemo(() => sortLeaderboard(entries, metric), [entries, metric]);
  const rank = optIn ? getLeaderboardRank(entries, partnerId, metric) : 0;
  const myEntry = entries.find((entry) => entry.partner_id === partnerId);

  async function saveOptIn() {
    setSaving(true);
    const res = await fetch("/api/partner/leaderboard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, showCompany }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return toast.error(data.error ?? "Could not update leaderboard preferences.");
    setOptIn({ partner_id: partnerId, display_name: displayName.trim(), show_company: showCompany, opted_in_at: new Date().toISOString() });
    toast.success("You’re on the leaderboard. Rankings refresh within five minutes.");
  }

  async function optOut() {
    setSaving(true);
    const res = await fetch("/api/partner/leaderboard", { method: "DELETE" });
    setSaving(false);
    if (!res.ok) return toast.error("Could not opt you out right now.");
    setOptIn(null);
    toast.success("You’ve been removed from the leaderboard.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="size-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-ink">Leaderboard</h1>
          </div>
          <p className="mt-1 text-sm text-ink-muted">See the leaders, celebrate wins, and keep your momentum going.</p>
        </div>
        {optIn && (
          <button onClick={optOut} disabled={saving} className="text-left text-sm font-medium text-ink-muted hover:text-danger disabled:opacity-50">
            Opt out of leaderboard
          </button>
        )}
      </div>

      {!optIn ? (
        <section className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-accent-50 p-6">
          <div className="flex gap-3">
            <div className="rounded-lg bg-brand-600 p-2.5"><Crown className="size-5 text-white" /></div>
            <div>
              <h2 className="font-semibold text-ink">Join the leaderboard</h2>
              <p className="mt-1 text-sm text-ink-muted">Participation is optional. Choose the name partners see — it can be your real name or a pseudonym.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block text-sm font-medium text-ink">
              Display name
              <input value={displayName} maxLength={60} onChange={(event) => setDisplayName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm text-ink-muted">
              <input type="checkbox" checked={showCompany} onChange={(event) => setShowCompany(event.target.checked)} className="size-4 rounded border-line accent-brand-600" />
              Show company
            </label>
          </div>
          <button onClick={saveOptIn} disabled={saving || displayName.trim().length < 2} className="mt-4 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Joining..." : "Join leaderboard"}
          </button>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Your {metricLabels[metric].toLowerCase()}</p>
            <p className="mt-2 text-3xl font-bold text-brand-900">{myEntry ? getLeaderboardValue(myEntry, metric) : 0}</p>
            <p className="mt-1 text-sm text-brand-700">{periodLabels[period].toLowerCase()}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Your rank</p>
            <p className="mt-2 text-3xl font-bold text-ink">{rank ? `#${rank}` : "—"}</p>
            <p className="mt-1 text-sm text-ink-muted">{rank ? `out of ${sorted.length} ranked partners` : "Keep building — your first eligible result will appear here."}</p>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-lg bg-surface-raised p-1">
            {(Object.keys(periodLabels) as LeaderboardPeriod[]).map((value) => (
              <button key={value} onClick={() => setPeriod(value)} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", period === value ? "bg-surface text-brand-700 shadow-sm" : "text-ink-muted hover:text-ink")}>
                {periodLabels[value]}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg bg-surface-raised p-1">
            {(Object.keys(metricLabels) as LeaderboardMetric[]).map((value) => (
              <button key={value} onClick={() => setMetric(value)} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", metric === value ? "bg-surface text-brand-700 shadow-sm" : "text-ink-muted hover:text-ink")}>
                {metricLabels[value]}
              </button>
            ))}
          </div>
        </div>
        {sorted.length ? (
          <ol className="divide-y divide-line">
            {sorted.slice(0, topN).map((entry, index) => {
              const entryRank = index + 1;
              return (
                <li key={entry.partner_id} className={cn("flex items-center gap-3 px-4 py-3.5", entry.partner_id === partnerId && "bg-brand-50/70")}>
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", rankClass(entryRank))}>{entryRank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{entry.display_name}{entry.partner_id === partnerId && <span className="ml-2 text-xs font-medium text-brand-600">You</span>}</p>
                    {entry.show_company && entry.company_name && <p className="truncate text-xs text-ink-muted">{entry.company_name}</p>}
                  </div>
                  <span className="text-lg font-bold text-ink">{getLeaderboardValue(entry, metric)}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="px-6 py-12 text-center">
            <Users className="mx-auto size-7 text-ink-muted" />
            <p className="mt-3 text-sm font-medium text-ink">No rankings yet</p>
            <p className="mt-1 text-sm text-ink-muted">Eligible activity appears after a referral has progressed and the 24-hour review window has passed.</p>
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-ink-muted"><ShieldCheck className="size-3.5" /> Submissions are counted after 24 hours and only once they move past submitted. Closed deals count after the refund window.</div>
      </section>
    </div>
  );
}
