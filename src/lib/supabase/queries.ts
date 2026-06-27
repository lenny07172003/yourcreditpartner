import { SupabaseClient } from "@supabase/supabase-js";
import type {
  Partner,
  PartnerType,
  FastStartVideo,
  PartnerVideoProgress,
  Referral,
  Commission,
  CommissionTier,
  MonthlyPartnerStats,
  Payout,
  PartnerEvent,
  AdminUser,
  SalesRep,
  ReferralAssignment,
  CloserCommission,
  MonthlyCompanyStats,
} from "@/types/database";
import { OCG_ORG_ID } from "@/lib/org/context";

// ============================================================
// PARTNER QUERIES
// ============================================================

export async function getPartnerByAuthId(
  supabase: SupabaseClient,
  authUserId: string,
  orgId?: string
): Promise<Partner | null> {
  let query = supabase
    .from("partners")
    .select("*")
    .eq("auth_user_id", authUserId);
  if (orgId) query = query.eq("org_id", orgId);
  const { data, error } = await query.single();
  if (error) return null;
  return data as Partner;
}

export async function getPartnerByEmail(
  supabase: SupabaseClient,
  email: string,
  orgId: string = OCG_ORG_ID
): Promise<Partner | null> {
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("org_id", orgId)
    .eq("email", email.toLowerCase())
    .single();
  if (error) return null;
  return data as Partner;
}

export async function getPartnerBySlug(
  supabase: SupabaseClient,
  slug: string,
  orgId: string = OCG_ORG_ID
): Promise<Partner | null> {
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("org_id", orgId)
    .eq("partner_slug", slug)
    .single();
  if (error) return null;
  return data as Partner;
}

// ============================================================
// PARTNER TYPES
// ============================================================

export async function getActivePartnerTypes(
  supabase: SupabaseClient,
  orgId: string = OCG_ORG_ID
): Promise<PartnerType[]> {
  const { data, error } = await supabase
    .from("partner_types")
    .select("*")
    .eq("org_id", orgId)
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as PartnerType[];
}

// ============================================================
// FAST START VIDEOS
// ============================================================

export async function getVideosForPartnerType(
  supabase: SupabaseClient,
  partnerTypeSlug: string,
  orgId: string = OCG_ORG_ID
): Promise<FastStartVideo[]> {
  // Get the fast_start_track for this partner type
  const { data: pt } = await supabase
    .from("partner_types")
    .select("fast_start_track")
    .eq("org_id", orgId)
    .eq("slug", partnerTypeSlug)
    .single();

  if (!pt) return [];

  const track = pt.fast_start_track;

  // Get videos where tracks overlaps with [track, 'core']
  const { data, error } = await supabase
    .from("fast_start_videos")
    .select("*")
    .eq("org_id", orgId)
    .overlaps("tracks", [track, "core"])
    .order("sort_order");

  if (error) throw error;
  return (data ?? []) as FastStartVideo[];
}

export async function getVideoProgress(
  supabase: SupabaseClient,
  partnerId: string,
  orgId: string = OCG_ORG_ID
): Promise<PartnerVideoProgress[]> {
  const { data, error } = await supabase
    .from("partner_video_progress")
    .select("*")
    .eq("org_id", orgId)
    .eq("partner_id", partnerId);
  if (error) throw error;
  return (data ?? []) as PartnerVideoProgress[];
}

// ============================================================
// COMMISSION TIERS
// ============================================================

export async function getCommissionTiers(
  supabase: SupabaseClient,
  orgId: string = OCG_ORG_ID
): Promise<CommissionTier[]> {
  const { data, error } = await supabase
    .from("commission_tiers")
    .select("*")
    .eq("org_id", orgId)
    .eq("active", true)
    .order("tier_number");
  if (error) throw error;
  return (data ?? []) as CommissionTier[];
}

// ============================================================
// REFERRALS
// ============================================================

export async function getPartnerReferrals(
  supabase: SupabaseClient,
  partnerId: string,
  orgId: string = OCG_ORG_ID
): Promise<Referral[]> {
  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("org_id", orgId)
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Referral[];
}

export async function getReferralByGhlContactId(
  supabase: SupabaseClient,
  contactId: string,
  orgId: string = OCG_ORG_ID
): Promise<Referral | null> {
  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("org_id", orgId)
    .eq("ghl_contact_id", contactId)
    .single();
  if (error) return null;
  return data as Referral;
}

export async function checkDuplicateReferral(
  supabase: SupabaseClient,
  clientEmail: string,
  partnerId: string,
  daysWindow: number = 90,
  orgId: string = OCG_ORG_ID
): Promise<Referral | null> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysWindow);

  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("org_id", orgId)
    .eq("client_email", clientEmail.toLowerCase())
    .neq("partner_id", partnerId)
    .gte("created_at", cutoff.toISOString())
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data as Referral | null;
}

// ============================================================
// COMMISSIONS
// ============================================================

export async function getPartnerCommissions(
  supabase: SupabaseClient,
  partnerId: string,
  closeMonth?: string,
  orgId: string = OCG_ORG_ID
): Promise<Commission[]> {
  let query = supabase
    .from("commissions")
    .select("*")
    .eq("org_id", orgId)
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  if (closeMonth) {
    query = query.eq("close_month", closeMonth);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Commission[];
}

// ============================================================
// MONTHLY PARTNER STATS
// ============================================================

export async function getMonthlyStats(
  supabase: SupabaseClient,
  partnerId: string,
  closeMonth: string,
  orgId: string = OCG_ORG_ID
): Promise<MonthlyPartnerStats | null> {
  const { data, error } = await supabase
    .from("monthly_partner_stats")
    .select("*")
    .eq("org_id", orgId)
    .eq("partner_id", partnerId)
    .eq("close_month", closeMonth)
    .single();
  if (error) return null;
  return data as MonthlyPartnerStats;
}

export async function upsertMonthlyStats(
  supabase: SupabaseClient,
  stats: Partial<MonthlyPartnerStats> & { partner_id: string; close_month: string }
): Promise<MonthlyPartnerStats> {
  const { data, error } = await supabase
    .from("monthly_partner_stats")
    .upsert({ ...stats, org_id: stats.org_id ?? OCG_ORG_ID }, { onConflict: "org_id,partner_id,close_month" })
    .select()
    .single();
  if (error) throw error;
  return data as MonthlyPartnerStats;
}

// ============================================================
// PAYOUTS
// ============================================================

export async function getPartnerPayouts(
  supabase: SupabaseClient,
  partnerId: string,
  orgId: string = OCG_ORG_ID
): Promise<Payout[]> {
  const { data, error } = await supabase
    .from("payouts")
    .select("*")
    .eq("org_id", orgId)
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payout[];
}

// ============================================================
// PARTNER EVENTS
// ============================================================

export async function logPartnerEvent(
  supabase: SupabaseClient,
  event: {
    org_id?: string;
    partner_id: string | null;
    actor: "partner" | "system" | "admin";
    event_type: string;
    payload?: Record<string, unknown>;
  }
): Promise<PartnerEvent> {
  const { data, error } = await supabase
    .from("partner_events")
    .insert({ ...event, org_id: event.org_id ?? OCG_ORG_ID })
    .select()
    .single();
  if (error) throw error;
  return data as PartnerEvent;
}

// ============================================================
// ADMIN
// ============================================================

export async function isAdmin(
  supabase: SupabaseClient,
  authUserId: string,
  orgId: string = OCG_ORG_ID
): Promise<boolean> {
  const { data } = await supabase
    .from("admin_users")
    .select("id")
    .eq("org_id", orgId)
    .eq("auth_user_id", authUserId)
    .single();
  return !!data;
}

export async function isAdminByEmail(
  supabase: SupabaseClient,
  email: string,
  orgId: string = OCG_ORG_ID
): Promise<AdminUser | null> {
  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .eq("org_id", orgId)
    .eq("email", email.toLowerCase())
    .single();
  return data as AdminUser | null;
}

// ============================================================
// SALES REPS
// ============================================================

export async function getActiveSalesReps(
  supabase: SupabaseClient,
  orgId: string = OCG_ORG_ID
): Promise<SalesRep[]> {
  const { data, error } = await supabase
    .from("sales_reps")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "active")
    .order("last_name");
  if (error) throw error;
  return (data ?? []) as SalesRep[];
}

export async function getReferralAssignment(
  supabase: SupabaseClient,
  referralId: string,
  orgId: string = OCG_ORG_ID
): Promise<ReferralAssignment | null> {
  const { data } = await supabase
    .from("referral_assignments")
    .select("*")
    .eq("org_id", orgId)
    .eq("referral_id", referralId)
    .single();
  return data as ReferralAssignment | null;
}

// ============================================================
// COMPANY STATS
// ============================================================

export async function getCompanyStats(
  supabase: SupabaseClient,
  closeMonth: string,
  orgId: string = OCG_ORG_ID
): Promise<MonthlyCompanyStats | null> {
  const { data } = await supabase
    .from("monthly_company_stats")
    .select("*")
    .eq("org_id", orgId)
    .eq("close_month", closeMonth)
    .single();
  return data as MonthlyCompanyStats | null;
}

// ============================================================
// CLOSER COMMISSIONS
// ============================================================

export async function getCloserCommissions(
  supabase: SupabaseClient,
  salesRepId: string,
  closeMonth?: string,
  orgId: string = OCG_ORG_ID
): Promise<CloserCommission[]> {
  let query = supabase
    .from("closer_commissions")
    .select("*")
    .eq("org_id", orgId)
    .eq("sales_rep_id", salesRepId)
    .order("created_at", { ascending: false });

  if (closeMonth) {
    query = query.eq("close_month", closeMonth);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CloserCommission[];
}
