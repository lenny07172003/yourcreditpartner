-- 0001_init.sql — Core schema for YourCreditPartner
-- Tables: partner_types, partners, fast_start_videos, partner_video_progress,
--         referrals, commission_tiers, commissions, monthly_partner_stats,
--         payouts, partner_events, email_sends, admin_users

-- ============================================================
-- PARTNER TYPES (config / lookup table)
-- ============================================================
CREATE TABLE partner_types (
  slug            text PRIMARY KEY,
  display_name    text NOT NULL,
  email_variant   text NOT NULL,
  ghl_tag         text NOT NULL,
  why_they_refer  text,
  fast_start_track text NOT NULL,
  icon            text,
  active          boolean DEFAULT true,
  sort_order      int DEFAULT 0
);

-- ============================================================
-- PARTNERS
-- ============================================================
CREATE TABLE partners (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id              uuid REFERENCES auth.users(id) UNIQUE,
  email                     text UNIQUE NOT NULL,
  phone                     text NOT NULL,
  first_name                text NOT NULL,
  last_name                 text NOT NULL,
  company_name              text,
  partner_type              text NOT NULL REFERENCES partner_types(slug),
  why_partnering            text,
  expected_volume           text,
  state_of_operation        text,
  partner_slug              text UNIQUE NOT NULL,
  status                    text DEFAULT 'active' CHECK (status IN ('active','paused','terminated')),
  agreement_signed_at       timestamptz,
  agreement_ip              text,
  agreement_user_agent      text,
  agreement_version         text DEFAULT 'v1.0',
  agreement_pdf_url         text,
  zelle_handle              text,
  w9_url                    text,
  commission_rate_override  numeric,
  notes_internal            text,
  last_submission_at        timestamptz,
  fast_start_completed_at   timestamptz,
  fast_start_skipped_at     timestamptz,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now(),
  deleted_at                timestamptz
);

CREATE INDEX idx_partners_auth_user ON partners (auth_user_id);
CREATE INDEX idx_partners_email ON partners (email);
CREATE INDEX idx_partners_slug ON partners (partner_slug);
CREATE INDEX idx_partners_status ON partners (status);

-- ============================================================
-- FAST START VIDEOS
-- ============================================================
CREATE TABLE fast_start_videos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  title             text NOT NULL,
  description       text,
  video_url         text,
  duration_seconds  int,
  thumbnail_url     text,
  sort_order        int NOT NULL,
  tracks            text[] NOT NULL,
  required          boolean DEFAULT true,
  cta_label         text,
  cta_url           text,
  created_at        timestamptz DEFAULT now()
);

-- ============================================================
-- PARTNER VIDEO PROGRESS
-- ============================================================
CREATE TABLE partner_video_progress (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id            uuid NOT NULL REFERENCES partners(id),
  video_id              uuid NOT NULL REFERENCES fast_start_videos(id),
  started_at            timestamptz,
  completed_at          timestamptz,
  last_position_seconds int DEFAULT 0,
  UNIQUE (partner_id, video_id)
);

-- ============================================================
-- COMMISSION TIERS (admin-editable config)
-- ============================================================
CREATE TABLE commission_tiers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_number   int UNIQUE NOT NULL,
  display_name  text NOT NULL,
  min_closes    int NOT NULL,
  max_closes    int,
  rate          numeric NOT NULL,
  mechanic      text NOT NULL DEFAULT 'retroactive' CHECK (mechanic IN ('retroactive','marginal')),
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE referrals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id            uuid NOT NULL REFERENCES partners(id),
  partner_type          text NOT NULL,
  submission_path       text CHECK (submission_path IN ('partner_filled','client_filled')),
  client_first_name     text NOT NULL,
  client_last_name      text NOT NULL,
  client_email          text NOT NULL,
  client_phone          text,
  client_state          text,
  client_situation      text,
  ghl_contact_id        text,
  ghl_opportunity_id    text,
  stage                 text DEFAULT 'submitted' CHECK (stage IN (
                          'submitted','booked','consulted','closed_won',
                          'active_service','net_revenue_realized','refunded')),
  flagged_for_review    boolean DEFAULT false,
  booked_at             timestamptz,
  consulted_at          timestamptz,
  closed_won_at         timestamptz,
  gross_revenue_cents   bigint,
  processing_fee_cents  bigint,
  closer_share_cents    bigint,
  net_revenue_cents     bigint,
  payment_received_at   timestamptz,
  refund_window_ends_at timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_referrals_partner ON referrals (partner_id);
CREATE INDEX idx_referrals_stage ON referrals (stage);
CREATE INDEX idx_referrals_client_email ON referrals (client_email);
CREATE INDEX idx_referrals_ghl_contact ON referrals (ghl_contact_id);

-- ============================================================
-- PAYOUTS (partner payouts)
-- ============================================================
CREATE TABLE payouts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        uuid NOT NULL REFERENCES partners(id),
  total_cents       bigint NOT NULL,
  commission_count  int NOT NULL,
  zelle_handle      text NOT NULL,
  zelle_reference   text,
  status            text DEFAULT 'queued' CHECK (status IN ('queued','sent','confirmed','failed')),
  notes             text,
  created_at        timestamptz DEFAULT now(),
  sent_at           timestamptz
);

-- ============================================================
-- COMMISSIONS (partner commissions)
-- ============================================================
CREATE TABLE commissions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id           uuid NOT NULL REFERENCES referrals(id),
  partner_id            uuid NOT NULL REFERENCES partners(id),
  close_month           date NOT NULL,
  net_revenue_cents     bigint NOT NULL,
  commission_rate       numeric NOT NULL,
  amount_cents          bigint NOT NULL,
  tier_at_finalization  int,
  state                 text DEFAULT 'pending' CHECK (state IN (
                          'pending','earned','payable','paid','voided')),
  earned_at             timestamptz,
  payable_at            timestamptz,
  paid_at               timestamptz,
  payout_id             uuid REFERENCES payouts(id),
  voided_reason         text,
  last_recalc_at        timestamptz,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_commissions_partner_month ON commissions (partner_id, close_month);
CREATE INDEX idx_commissions_state ON commissions (state);
CREATE INDEX idx_commissions_referral ON commissions (referral_id);

-- ============================================================
-- MONTHLY PARTNER STATS (one row per partner per month)
-- ============================================================
CREATE TABLE monthly_partner_stats (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id                uuid NOT NULL REFERENCES partners(id),
  close_month               date NOT NULL,
  close_count               int DEFAULT 0,
  total_net_revenue_cents    bigint DEFAULT 0,
  current_tier              int DEFAULT 1,
  current_rate              numeric DEFAULT 0.15,
  finalized                 boolean DEFAULT false,
  finalized_at              timestamptz,
  projected_earnings_cents   bigint DEFAULT 0,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now(),
  UNIQUE (partner_id, close_month)
);

-- ============================================================
-- PARTNER EVENTS (append-only audit log)
-- ============================================================
CREATE TABLE partner_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  uuid REFERENCES partners(id),
  actor       text CHECK (actor IN ('partner','system','admin')),
  event_type  text NOT NULL,
  payload     jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_partner_events_partner ON partner_events (partner_id);
CREATE INDEX idx_partner_events_type ON partner_events (event_type);

-- ============================================================
-- EMAIL SENDS (partner-side email tracking)
-- ============================================================
CREATE TABLE email_sends (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        uuid REFERENCES partners(id),
  campaign          text NOT NULL,
  subject           text,
  sent_at           timestamptz DEFAULT now(),
  opened_at         timestamptz,
  clicked_at        timestamptz,
  resend_message_id text
);

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE TABLE admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  uuid REFERENCES auth.users(id) UNIQUE,
  email         text UNIQUE NOT NULL,
  role          text DEFAULT 'admin' CHECK (role IN ('admin','viewer')),
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Partners: own row only
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own record"
  ON partners FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Partners can update own record"
  ON partners FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Referrals: partner can view their own
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own referrals"
  ON referrals FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

CREATE POLICY "Partners can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

-- Commissions: partner-scoped read only
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own commissions"
  ON commissions FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

-- Payouts: partner-scoped read only
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own payouts"
  ON payouts FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

-- Partner video progress: partner-scoped
ALTER TABLE partner_video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own video progress"
  ON partner_video_progress FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

CREATE POLICY "Partners can upsert own video progress"
  ON partner_video_progress FOR INSERT
  WITH CHECK (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

CREATE POLICY "Partners can update own video progress"
  ON partner_video_progress FOR UPDATE
  USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

-- Monthly partner stats: partner-scoped read
ALTER TABLE monthly_partner_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own monthly stats"
  ON monthly_partner_stats FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

-- Fast start videos: public read
ALTER TABLE fast_start_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fast start videos"
  ON fast_start_videos FOR SELECT
  USING (true);

-- Partner types: public read
ALTER TABLE partner_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view partner types"
  ON partner_types FOR SELECT
  USING (true);

-- Commission tiers: public read
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view commission tiers"
  ON commission_tiers FOR SELECT
  USING (true);

-- Partner events: server-side only (no client policies)
ALTER TABLE partner_events ENABLE ROW LEVEL SECURITY;

-- Email sends: server-side only
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

-- Admin users: server-side only
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEED: partner_types
-- ============================================================
INSERT INTO partner_types (slug, display_name, email_variant, ghl_tag, why_they_refer, fast_start_track, icon, sort_order) VALUES
  ('mlo',          'Mortgage Loan Officer',     'mlo',        'partner-type-mlo',          'Buyer denied or borderline — fix credit, save the deal.',                    'mlo',          'home',         1),
  ('realtor',      'Realtor',                   'realtor',    'partner-type-realtor',      'Pre-approval failed — recover the lead instead of losing it.',               'realtor',      'key-round',    2),
  ('solar',        'Solar Rep',                 'solar',      'partner-type-solar',        'Financing declined — credit fix unlocks the install.',                       'solar',        'sun',          3),
  ('fi',           'F&I Manager (Auto)',        'auto',       'partner-type-fi',           'Subprime buyer — better tier = better backend margin.',                      'auto',         'car',          4),
  ('dealership',   'Independent Dealership',    'auto',       'partner-type-dealership',   'Walk-away buyers — credit recovery brings them back.',                       'auto',         'car-front',    5),
  ('insurance',    'Insurance Agent',           'core',       'partner-type-insurance',    'Credit affects auto/home premiums — value-add retention.',                   'core',         'shield-check', 6),
  ('tax',          'Tax Professional / CPA',    'core',       'partner-type-tax',          'Sees client debt + scores firsthand. Trusted channel.',                      'core',         'calculator',   7),
  ('advisor',      'Financial Advisor',         'core',       'partner-type-advisor',      'Wealth plan blocked by score — natural prerequisite.',                       'core',         'trending-up',  8),
  ('investor',     'Real Estate Investor',      'core',       'partner-type-investor',     'Tenant screening / rent-to-own pipeline.',                                  'core',         'building-2',   9),
  ('contractor',   'Roofer / Home Improvement', 'contractor', 'partner-type-contractor',   'Financing-dependent jobs — declined homeowners = lost work.',                'contractor',   'hard-hat',     10),
  ('pi-attorney',  'Personal Injury Attorney',  'core',       'partner-type-pi-attorney',  'Post-settlement clients with capital to rebuild.',                           'core',         'scale',        11),
  ('hr-benefits',  'HR / Benefits Broker',      'core',       'partner-type-hr-benefits',  'Employee financial wellness as voluntary benefit.',                          'core',         'users',        12),
  ('coach',        'Business Coach',            'core',       'partner-type-coach',        'Funding-dependent clients — clean before stacking.',                         'core',         'rocket',       13),
  ('property-mgr', 'Property Manager',          'core',       'partner-type-property-mgr', 'Failed tenant screenings — rebuild back to qualifying.',                     'core',         'building',     14),
  ('bk-attorney',  'Bankruptcy Attorney',       'core',       'partner-type-bk-attorney',  'Post-discharge rebuild — captive motivated pipeline.',                       'core',         'gavel',        15),
  ('individual',   'Individual Referrer',       'individual', 'partner-type-individual',   'Existing clients, friends, family — affiliate-style.',                       'individual',   'user-plus',    16);

-- ============================================================
-- SEED: commission_tiers
-- ============================================================
INSERT INTO commission_tiers (tier_number, display_name, min_closes, max_closes, rate, mechanic) VALUES
  (1, 'Starter',  1,  9,    0.15, 'retroactive'),
  (2, 'Producer', 10, 24,   0.20, 'retroactive'),
  (3, 'Top Tier', 25, 39,   0.25, 'retroactive'),
  (4, 'Elite',    40, NULL, 0.35, 'retroactive');

-- ============================================================
-- SEED: fast_start_videos (placeholder — video_url = NULL)
-- ============================================================
INSERT INTO fast_start_videos (slug, title, sort_order, tracks, required) VALUES
  ('welcome-and-mission',        'Welcome to YourCreditPartner — Our Mission',              1, '{core,mlo,realtor,solar,auto,contractor,individual}', true),
  ('dashboard-walkthrough',      'Your Dashboard — A Complete Walkthrough',                  2, '{core,mlo,realtor,solar,auto,contractor,individual}', true),
  ('how-to-submit-a-client',     'How to Submit a Client (Both Ways)',                       3, '{core,mlo,realtor,solar,auto,contractor,individual}', true),
  ('tracking-live-commissions',  'Tracking Live Commissions When Deals Close',               4, '{core,mlo,realtor,solar,auto,contractor,individual}', true),
  ('when-commissions-paid',      'When (and How) You Get Paid',                              5, '{core,mlo,realtor,solar,auto,contractor,individual}', true),
  ('credit-education-deep-dive', 'Credit Education — Go Deeper',                            6, '{core,mlo,realtor,solar,auto,contractor,individual}', true),
  ('mlo-playbook',               'MLO Playbook — Saving Declined Deals',                    7, '{mlo}',          true),
  ('realtor-playbook',           'Realtor Playbook — Recovering Lost Pre-Approvals',         7, '{realtor}',      true),
  ('solar-playbook',             'Solar Playbook — Unlocking Stuck Installs',                7, '{solar}',        true),
  ('auto-playbook',              'F&I + Dealer Playbook — Subprime Recovery',                7, '{auto}',         true),
  ('contractor-playbook',        'Contractor Playbook — Closing Financed Jobs',              7, '{contractor}',   true),
  ('individual-playbook',        'Individual Referrer — Earning From Your Network',          7, '{individual}',   true);

-- ============================================================
-- SEED: admin user (Lenny)
-- ============================================================
INSERT INTO admin_users (email, role) VALUES
  ('lenny@opulentcreditconsulting.com', 'admin');

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_monthly_partner_stats_updated_at
  BEFORE UPDATE ON monthly_partner_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
