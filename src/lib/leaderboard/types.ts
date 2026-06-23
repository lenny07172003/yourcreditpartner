export type LeaderboardPeriod = "month" | "all_time";
export type LeaderboardMetric = "submissions" | "closes";

export interface LeaderboardEntry {
  partner_id: string;
  display_name: string;
  show_company: boolean;
  company_name: string | null;
  period: LeaderboardPeriod;
  submissions_count: number;
  closes_count: number;
  refreshed_at: string;
}

export interface LeaderboardOptIn {
  partner_id: string;
  display_name: string;
  show_company: boolean;
  opted_in_at: string;
}
