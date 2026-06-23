import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LeaderboardEntry,
  LeaderboardMetric,
  LeaderboardPeriod,
} from "@/lib/leaderboard/types";

const MAX_LEADERBOARD_ROWS = 100;

export function getLeaderboardValue(entry: LeaderboardEntry, metric: LeaderboardMetric) {
  return metric === "submissions" ? entry.submissions_count : entry.closes_count;
}

export function sortLeaderboard(
  entries: LeaderboardEntry[],
  metric: LeaderboardMetric
) {
  return [...entries]
    .filter((entry) => getLeaderboardValue(entry, metric) > 0)
    .sort((a, b) => {
      const valueDiff = getLeaderboardValue(b, metric) - getLeaderboardValue(a, metric);
      if (valueDiff !== 0) return valueDiff;
      return a.display_name.localeCompare(b.display_name);
    });
}

export function getLeaderboardRank(
  entries: LeaderboardEntry[],
  partnerId: string,
  metric: LeaderboardMetric
) {
  return sortLeaderboard(entries, metric).findIndex((entry) => entry.partner_id === partnerId) + 1;
}

export async function getLeaderboardRankings(
  supabase: SupabaseClient,
  period: LeaderboardPeriod
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard_rankings")
    .select("partner_id, display_name, show_company, company_name, period, submissions_count, closes_count, refreshed_at")
    .eq("period", period)
    .limit(MAX_LEADERBOARD_ROWS);

  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}
