import { redirect } from "next/navigation";
import { LeaderboardView } from "@/components/dashboard/LeaderboardView";
import { getLeaderboardRankings } from "@/lib/leaderboard/rankings";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPartnerByAuthId } from "@/lib/supabase/queries";
import type { LeaderboardOptIn } from "@/lib/leaderboard/types";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const partner = await getPartnerByAuthId(supabase, user.id);
  if (!partner) redirect("/auth/login");

  const admin = createAdminClient();
  const [settingsResult, optInResult, monthEntries, allTimeEntries] = await Promise.all([
    admin.from("leaderboard_settings").select("enabled, top_n").eq("org_id", partner.org_id).maybeSingle(),
    admin.from("partner_leaderboard_opt_in").select("org_id, partner_id, display_name, show_company, opted_in_at").eq("org_id", partner.org_id).eq("partner_id", partner.id).maybeSingle(),
    getLeaderboardRankings(admin, "month", partner.org_id),
    getLeaderboardRankings(admin, "all_time", partner.org_id),
  ]);

  if (settingsResult.error || !settingsResult.data?.enabled) redirect("/dashboard");

  return <LeaderboardView partnerId={partner.id} orgId={partner.org_id} partnerName={`${partner.first_name} ${partner.last_name}`} optIn={optInResult.data as LeaderboardOptIn | null} monthEntries={monthEntries} allTimeEntries={allTimeEntries} topN={settingsResult.data.top_n} />;
}
