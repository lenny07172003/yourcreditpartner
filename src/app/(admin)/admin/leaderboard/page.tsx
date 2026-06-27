import { Trophy } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLeaderboardRankings, sortLeaderboard } from "@/lib/leaderboard/rankings";
import { OCG_ORG_ID } from "@/lib/org/context";

export default async function AdminLeaderboardPage() {
  const admin = createAdminClient();
  const [settingsResult, partnersResult, optInsResult, monthEntries] = await Promise.all([
    admin.from("leaderboard_settings").select("enabled, top_n, anti_gaming_min_age_hours").eq("org_id", OCG_ORG_ID).maybeSingle(),
    admin.from("partners").select("id, first_name, last_name, email, company_name, status").eq("org_id", OCG_ORG_ID).is("deleted_at", null).order("last_name"),
    admin.from("partner_leaderboard_opt_in").select("partner_id, display_name, show_company, opted_in_at").eq("org_id", OCG_ORG_ID),
    getLeaderboardRankings(admin, "month", OCG_ORG_ID),
  ]);

  const settings = settingsResult.data;
  const optIns = new Map((optInsResult.data ?? []).map((entry) => [entry.partner_id, entry]));
  const ranks = new Map(sortLeaderboard(monthEntries, "submissions").map((entry, index) => [entry.partner_id, index + 1]));
  const entryByPartner = new Map(monthEntries.map((entry) => [entry.partner_id, entry]));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-100 p-2.5"><Trophy className="size-5 text-amber-700" /></div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Leaderboard</h1>
          <p className="mt-1 text-sm text-ink-muted">Internal view of participation and this month’s eligible activity.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5"><p className="text-xs font-medium uppercase text-ink-muted">Leaderboard</p><p className="mt-1 text-xl font-bold text-ink">{settings?.enabled ? "Enabled" : "Disabled"}</p></div>
        <div className="rounded-xl border border-line bg-surface p-5"><p className="text-xs font-medium uppercase text-ink-muted">Opted in</p><p className="mt-1 text-xl font-bold text-ink">{optIns.size}</p></div>
        <div className="rounded-xl border border-line bg-surface p-5"><p className="text-xs font-medium uppercase text-ink-muted">Review window</p><p className="mt-1 text-xl font-bold text-ink">{settings?.anti_gaming_min_age_hours ?? 24} hours</p></div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4"><h2 className="text-sm font-semibold text-ink">All partners</h2><p className="mt-1 text-xs text-ink-muted">Partners who have opted out remain visible here only.</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-surface-raised text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-5 py-3 font-medium">Partner</th><th className="px-5 py-3 font-medium">Leaderboard status</th><th className="px-5 py-3 text-right font-medium">Submission rank</th><th className="px-5 py-3 text-right font-medium">Eligible submissions</th><th className="px-5 py-3 text-right font-medium">Eligible closes</th></tr></thead>
            <tbody className="divide-y divide-line">
              {(partnersResult.data ?? []).map((partner) => {
                const optIn = optIns.get(partner.id);
                const entry = entryByPartner.get(partner.id);
                return <tr key={partner.id}><td className="px-5 py-3.5"><p className="font-medium text-ink">{partner.first_name} {partner.last_name}</p><p className="text-xs text-ink-muted">{partner.email}</p></td><td className="px-5 py-3.5">{optIn ? <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">Opted in as {optIn.display_name}</span> : <span className="rounded-full bg-surface-raised px-2 py-1 text-xs font-medium text-ink-muted">Opted out</span>}</td><td className="px-5 py-3.5 text-right font-semibold text-ink">{ranks.get(partner.id) ? `#${ranks.get(partner.id)}` : "—"}</td><td className="px-5 py-3.5 text-right text-ink">{entry?.submissions_count ?? "—"}</td><td className="px-5 py-3.5 text-right text-ink">{entry?.closes_count ?? "—"}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
