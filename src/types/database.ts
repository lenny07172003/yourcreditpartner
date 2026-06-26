export type PartnerStatus = "active" | "paused" | "terminated";
export type ExpectedVolume = "1-3" | "4-10" | "11-25" | "25+";

export type ReferralStage =
  | "submitted"
  | "booked"
  | "consulted"
  | "closed_won"
  | "active_service"
  | "net_revenue_realized"
  | "refunded";

export type CommissionState =
  | "pending"
  | "earned"
  | "payable"
  | "paid"
  | "voided";

export type PayoutStatus = "queued" | "sent" | "confirmed" | "failed";
export type ActorType = "partner" | "system" | "admin";
export type AdminRole = "admin" | "viewer";
export type TierMechanic = "retroactive" | "marginal";
export type SubmissionPath = "partner_filled" | "client_filled";
export type SalesRepStatus = "active" | "paused" | "terminated";

export type AppointmentStatus = "scheduled" | "rescheduled" | "cancelled" | "completed" | "no_show";

export type NurtureStatus = "active" | "paused" | "completed" | "opted_out";
export type NurtureStage =
  | "submitted_to_booked"
  | "booked_to_consulted"
  | "noshow_recovery"
  | "consulted_to_closed"
  | "completed"
  | "dormant";

// ============================================================
// TABLE TYPES
// ============================================================

export interface PartnerType {
  slug: string;
  display_name: string;
  email_variant: string;
  ghl_tag: string;
  why_they_refer: string | null;
  fast_start_track: string;
  icon: string | null;
  active: boolean;
  sort_order: number;
}

export interface Partner {
  id: string;
  auth_user_id: string | null;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  partner_type: string;
  why_partnering: string | null;
  expected_volume: ExpectedVolume | null;
  state_of_operation: string | null;
  partner_slug: string;
  status: PartnerStatus;
  agreement_signed_at: string | null;
  agreement_ip: string | null;
  agreement_user_agent: string | null;
  agreement_version: string;
  agreement_pdf_url: string | null;
  agreement_signature_name: string | null;
  zelle_handle: string | null;
  w9_url: string | null;
  commission_rate_override: number | null;
  notes_internal: string | null;
  last_submission_at: string | null;
  fast_start_completed_at: string | null;
  fast_start_skipped_at: string | null;
  referred_by_partner_id: string | null;
  welcome_drip_step: number;
  last_nudge_sent_at: string | null;
  last_tip_sent_at: string | null;
  last_tip_index: number;
  last_digest_month: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PartnerReferralCommission {
  id: string;
  source_commission_id: string;
  referring_partner_id: string;
  earning_partner_id: string;
  override_rate: number;
  amount_cents: number;
  state: CommissionState;
  earned_at: string | null;
  payable_at: string | null;
  paid_at: string | null;
  payout_id: string | null;
  voided_reason: string | null;
  created_at: string;
}

export interface FastStartVideo {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  sort_order: number;
  tracks: string[];
  required: boolean;
  cta_label: string | null;
  cta_url: string | null;
  created_at: string;
}

export interface PartnerVideoProgress {
  id: string;
  partner_id: string;
  video_id: string;
  started_at: string | null;
  completed_at: string | null;
  last_position_seconds: number;
}

export interface CommissionTier {
  id: string;
  tier_number: number;
  display_name: string;
  min_closes: number;
  max_closes: number | null;
  rate: number;
  mechanic: TierMechanic;
  active: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  partner_id: string;
  partner_type: string;
  submission_path: SubmissionPath | null;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  client_phone: string | null;
  client_state: string | null;
  client_situation: string | null;
  ghl_contact_id: string | null;
  ghl_opportunity_id: string | null;
  stage: ReferralStage;
  flagged_for_review: boolean;
  booked_at: string | null;
  consulted_at: string | null;
  closed_won_at: string | null;
  gross_revenue_cents: number | null;
  processing_fee_cents: number | null;
  closer_share_cents: number | null;
  net_revenue_cents: number | null;
  payment_received_at: string | null;
  refund_window_ends_at: string | null;
  nurture_status: NurtureStatus;
  nurture_stage: NurtureStage;
  nurture_last_sent_at: string | null;
  nurture_opted_out_at: string | null;
  consult_no_show: boolean;
  appointment_id: string | null;
  appointment_at: string | null;
  appointment_end_at: string | null;
  appointment_status: AppointmentStatus | null;
  appointment_calendar_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  referral_id: string;
  partner_id: string;
  close_month: string;
  net_revenue_cents: number;
  commission_rate: number;
  amount_cents: number;
  tier_at_finalization: number | null;
  state: CommissionState;
  earned_at: string | null;
  payable_at: string | null;
  paid_at: string | null;
  payout_id: string | null;
  voided_reason: string | null;
  last_recalc_at: string | null;
  created_at: string;
}

export interface Payout {
  id: string;
  partner_id: string;
  total_cents: number;
  commission_count: number;
  zelle_handle: string;
  zelle_reference: string | null;
  status: PayoutStatus;
  notes: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface MonthlyPartnerStats {
  id: string;
  partner_id: string;
  close_month: string;
  close_count: number;
  total_net_revenue_cents: number;
  current_tier: number;
  current_rate: number;
  finalized: boolean;
  finalized_at: string | null;
  projected_earnings_cents: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerEvent {
  id: string;
  partner_id: string | null;
  actor: ActorType | null;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface EmailSend {
  id: string;
  partner_id: string | null;
  campaign: string;
  subject: string | null;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  resend_message_id: string | null;
}

export interface AdminUser {
  id: string;
  auth_user_id: string | null;
  email: string;
  role: AdminRole;
  created_at: string;
}

// ============================================================
// SALES REP / CLOSER TYPES
// ============================================================

export interface SalesRep {
  id: string;
  auth_user_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: SalesRepStatus;
  commission_rate: number;
  zelle_handle: string | null;
  hire_date: string | null;
  notes_internal: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ReferralAssignment {
  id: string;
  referral_id: string;
  sales_rep_id: string;
  assigned_at: string;
  assigned_by: string | null;
  locked_at: string | null;
  reassigned_count: number;
}

export interface CloserCommission {
  id: string;
  referral_id: string;
  sales_rep_id: string;
  close_month: string;
  gross_revenue_cents: number;
  processing_fee_cents: number;
  base_after_processing: number;
  commission_rate: number;
  amount_cents: number;
  state: CommissionState;
  earned_at: string | null;
  payable_at: string | null;
  paid_at: string | null;
  payout_id: string | null;
  voided_reason: string | null;
  created_at: string;
}

export interface CloserPayout {
  id: string;
  sales_rep_id: string;
  total_cents: number;
  commission_count: number;
  zelle_handle: string;
  zelle_reference: string | null;
  status: PayoutStatus;
  notes: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface MonthlyCompanyStats {
  id: string;
  close_month: string;
  total_revenue_cents: number;
  total_partner_commission_cents: number;
  total_closer_commission_cents: number;
  close_count: number;
  active_partner_count: number;
  finalized: boolean;
  finalized_at: string | null;
  updated_at: string;
}

// ============================================================
// CLIENT NURTURE TYPES
// ============================================================

export interface ClientNurtureQueue {
  id: string;
  referral_id: string;
  campaign_step: string;
  scheduled_for: string;
  sent_at: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  resend_message_id: string | null;
  created_at: string;
}

export interface ClientNurtureSend {
  id: string;
  referral_id: string;
  campaign_step: string;
  subject: string | null;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  resend_message_id: string | null;
}

export interface ClientNurtureTemplate {
  id: string;
  campaign_step: string;
  stage: string;
  delay_minutes: number;
  subject: string;
  preview_text: string | null;
  body_markdown: string;
  active: boolean;
  updated_at: string;
}

export interface RoundRobinConfig {
  id: string;
  last_assigned_rep_id: string | null;
  updated_at: string;
}

export interface CalendarAvailability {
  id: string;
  sales_rep_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  timezone: string;
  active: boolean;
  buffer_before_min: number;
  buffer_after_min: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarBooking {
  id: string;
  referral_id: string;
  sales_rep_id: string;
  scheduled_for: string;
  ends_at: string;
  duration_min: number;
  buffer_after_min: number;
  client_timezone: string;
  status: "booked" | "rescheduled" | "cancelled" | "no_show" | "attended";
  ics_uid: string;
  reschedule_count: number;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// INSERT TYPES (for creating new records)
// ============================================================

export type PartnerInsert = Omit<Partner, "id" | "created_at" | "updated_at" | "deleted_at" | "status"> & {
  status?: PartnerStatus;
};

export type ReferralInsert = Omit<Referral, "id" | "created_at" | "updated_at" | "stage" | "flagged_for_review" | "nurture_status" | "nurture_stage" | "consult_no_show"> & {
  stage?: ReferralStage;
};

export type CommissionInsert = Omit<Commission, "id" | "created_at" | "state"> & {
  state?: CommissionState;
};

// ============================================================
// UTILITY TYPES
// ============================================================

export interface TierInfo {
  tier: 1 | 2 | 3 | 4;
  rate: number;
  displayName: string;
  minCloses: number;
  maxCloses: number | null;
}

export interface RevenueWaterfall {
  gross_revenue_cents: number;
  processing_fee_cents: number;
  closer_share_cents: number;
  net_revenue_cents: number;
}
