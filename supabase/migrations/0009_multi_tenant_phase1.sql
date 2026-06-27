-- 0009_multi_tenant_phase1.sql
-- Phase 1: Multi-tenant retrofit foundation + A2P/integration kickoff.
-- This keeps the current OCG launch single-tenant in the UI while every
-- business table is scoped by org_id for the later SaaS rollout.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ORGS
-- ============================================================

CREATE TABLE IF NOT EXISTS orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  legal_name text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'suspended')),
  plan text NOT NULL DEFAULT 'launch'
    CHECK (plan IN ('launch', 'starter', 'growth', 'scale', 'enterprise')),
  primary_domain text,
  app_base_url text,
  cal_provider text NOT NULL DEFAULT 'in_house'
    CHECK (cal_provider IN ('in_house', 'ghl', 'cal_com')),
  timezone text NOT NULL DEFAULT 'America/New_York',
  admin_email text,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO orgs (
  id, slug, name, legal_name, primary_domain, app_base_url, timezone, admin_email
) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'ocg',
  'Opulent Credit Consulting',
  'Opulent Credit Consulting',
  'yourcreditpartner.com',
  COALESCE(current_setting('app.settings.public_app_url', true), 'http://localhost:3000'),
  'America/New_York',
  NULL
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  legal_name = EXCLUDED.legal_name,
  primary_domain = COALESCE(orgs.primary_domain, EXCLUDED.primary_domain),
  app_base_url = COALESCE(orgs.app_base_url, EXCLUDED.app_base_url),
  updated_at = now();

CREATE TRIGGER set_orgs_updated_at
  BEFORE UPDATE ON orgs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- JWT org resolver. The fallback keeps the current OCG-only demo usable until
-- existing Supabase users are stamped with app_metadata.org_id.
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'org_id', '')::uuid,
    '00000000-0000-4000-8000-000000000001'::uuid
  );
$$;

-- ============================================================
-- BRANDING + TENANT INTEGRATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS org_branding (
  org_id uuid PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
  public_name text NOT NULL,
  logo_url text,
  favicon_url text,
  primary_color text NOT NULL DEFAULT '#4F46E5',
  accent_color text NOT NULL DEFAULT '#7C3AED',
  support_email text,
  sender_name text NOT NULL DEFAULT 'YourCreditPartner',
  sender_email text,
  reply_to_email text,
  booking_headline text NOT NULL DEFAULT 'Book your free consultation',
  referral_headline text NOT NULL DEFAULT 'Refer a client',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO org_branding (
  org_id, public_name, primary_color, accent_color, sender_name,
  sender_email, reply_to_email, booking_headline, referral_headline
) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Opulent Credit Consulting',
  '#4F46E5',
  '#7C3AED',
  'YourCreditPartner',
  NULL,
  NULL,
  'Book your free credit consultation',
  'Refer a client to Opulent Credit Consulting'
) ON CONFLICT (org_id) DO NOTHING;

CREATE TRIGGER set_org_branding_updated_at
  BEFORE UPDATE ON org_branding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS tenant_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('twilio', 'stripe', 'resend', 'ghl', 'cal_com')),
  enabled boolean NOT NULL DEFAULT false,
  credentials_ciphertext text,
  credentials_iv text,
  credentials_tag text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, provider)
);

CREATE TRIGGER set_tenant_integrations_updated_at
  BEFORE UPDATE ON tenant_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO tenant_integrations (org_id, provider, enabled, config)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'resend', false, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000001', 'twilio', false, jsonb_build_object('a2p_status', 'not_submitted')),
  ('00000000-0000-4000-8000-000000000001', 'stripe', false, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000001', 'ghl', false, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000001', 'cal_com', false, '{}'::jsonb)
ON CONFLICT (org_id, provider) DO NOTHING;

-- ============================================================
-- RETROFIT org_id ON EXISTING TABLES
-- ============================================================

ALTER TABLE partner_types ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE fast_start_videos ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE partner_video_progress ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE commission_tiers ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE monthly_partner_stats ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE partner_events ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);

ALTER TABLE sales_reps ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE referral_assignments ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE closer_payouts ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE closer_commissions ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE monthly_company_stats ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE round_robin_config ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);

ALTER TABLE client_nurture_queue ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE client_nurture_sends ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE client_nurture_templates ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);

ALTER TABLE partner_referral_commissions ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);

ALTER TABLE leaderboard_settings ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE partner_leaderboard_opt_in ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);

ALTER TABLE calendar_availability ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE calendar_blocked_times ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE calendar_bookings ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);
ALTER TABLE calendar_event_log ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id);

-- Backfill direct/root tables.
UPDATE partner_types SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;
UPDATE partners SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;
UPDATE fast_start_videos SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;
UPDATE commission_tiers SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;
UPDATE admin_users SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;
UPDATE sales_reps SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;
UPDATE monthly_company_stats SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;
UPDATE round_robin_config SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;
UPDATE client_nurture_templates SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;
UPDATE leaderboard_settings SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;

-- Backfill dependent tables from their parents where possible.
UPDATE partner_video_progress pvp
SET org_id = p.org_id
FROM partners p
WHERE pvp.partner_id = p.id AND pvp.org_id IS NULL;

UPDATE referrals r
SET org_id = p.org_id
FROM partners p
WHERE r.partner_id = p.id AND r.org_id IS NULL;

UPDATE payouts po
SET org_id = p.org_id
FROM partners p
WHERE po.partner_id = p.id AND po.org_id IS NULL;

UPDATE commissions c
SET org_id = r.org_id
FROM referrals r
WHERE c.referral_id = r.id AND c.org_id IS NULL;

UPDATE monthly_partner_stats mps
SET org_id = p.org_id
FROM partners p
WHERE mps.partner_id = p.id AND mps.org_id IS NULL;

UPDATE partner_events pe
SET org_id = p.org_id
FROM partners p
WHERE pe.partner_id = p.id AND pe.org_id IS NULL;
UPDATE partner_events SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;

UPDATE email_sends es
SET org_id = p.org_id
FROM partners p
WHERE es.partner_id = p.id AND es.org_id IS NULL;
UPDATE email_sends SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;

UPDATE referral_assignments ra
SET org_id = r.org_id
FROM referrals r
WHERE ra.referral_id = r.id AND ra.org_id IS NULL;

UPDATE closer_payouts cp
SET org_id = sr.org_id
FROM sales_reps sr
WHERE cp.sales_rep_id = sr.id AND cp.org_id IS NULL;

UPDATE closer_commissions cc
SET org_id = r.org_id
FROM referrals r
WHERE cc.referral_id = r.id AND cc.org_id IS NULL;

UPDATE client_nurture_queue cnq
SET org_id = r.org_id
FROM referrals r
WHERE cnq.referral_id = r.id AND cnq.org_id IS NULL;

UPDATE client_nurture_sends cns
SET org_id = r.org_id
FROM referrals r
WHERE cns.referral_id = r.id AND cns.org_id IS NULL;

UPDATE partner_referral_commissions prc
SET org_id = p.org_id
FROM partners p
WHERE prc.referring_partner_id = p.id AND prc.org_id IS NULL;

UPDATE partner_leaderboard_opt_in plo
SET org_id = p.org_id
FROM partners p
WHERE plo.partner_id = p.id AND plo.org_id IS NULL;

UPDATE calendar_availability ca
SET org_id = sr.org_id
FROM sales_reps sr
WHERE ca.sales_rep_id = sr.id AND ca.org_id IS NULL;

UPDATE calendar_blocked_times cbt
SET org_id = sr.org_id
FROM sales_reps sr
WHERE cbt.sales_rep_id = sr.id AND cbt.org_id IS NULL;
UPDATE calendar_blocked_times SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;

UPDATE calendar_bookings cb
SET org_id = r.org_id
FROM referrals r
WHERE cb.referral_id = r.id AND cb.org_id IS NULL;

UPDATE calendar_event_log cel
SET org_id = cb.org_id
FROM calendar_bookings cb
WHERE cel.booking_id = cb.id AND cel.org_id IS NULL;
UPDATE calendar_event_log SET org_id = '00000000-0000-4000-8000-000000000001' WHERE org_id IS NULL;

-- Phase 1 safety default: current app remains OCG-only. Future SaaS signup can
-- remove these defaults after all writes pass explicit org_id.
ALTER TABLE partner_types ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE partners ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE fast_start_videos ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE partner_video_progress ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE commission_tiers ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE referrals ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE payouts ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE commissions ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE monthly_partner_stats ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE partner_events ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE email_sends ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE admin_users ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE sales_reps ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE referral_assignments ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE closer_payouts ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE closer_commissions ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE monthly_company_stats ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE round_robin_config ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE client_nurture_queue ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE client_nurture_sends ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE client_nurture_templates ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE partner_referral_commissions ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE leaderboard_settings ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE partner_leaderboard_opt_in ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE calendar_availability ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE calendar_blocked_times ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE calendar_bookings ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE calendar_event_log ALTER COLUMN org_id SET DEFAULT '00000000-0000-4000-8000-000000000001';

ALTER TABLE partner_types ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE partners ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE fast_start_videos ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE partner_video_progress ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE commission_tiers ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE referrals ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE payouts ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE commissions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE monthly_partner_stats ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE partner_events ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE email_sends ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE admin_users ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE sales_reps ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE referral_assignments ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE closer_payouts ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE closer_commissions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE monthly_company_stats ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE round_robin_config ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE client_nurture_queue ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE client_nurture_sends ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE client_nurture_templates ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE partner_referral_commissions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE leaderboard_settings ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE partner_leaderboard_opt_in ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE calendar_availability ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE calendar_blocked_times ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE calendar_bookings ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE calendar_event_log ALTER COLUMN org_id SET NOT NULL;

-- ============================================================
-- TENANT-SCOPED INDEXES / UNIQUES
-- ============================================================

ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_email_key;
ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_partner_slug_key;
ALTER TABLE fast_start_videos DROP CONSTRAINT IF EXISTS fast_start_videos_slug_key;
ALTER TABLE commission_tiers DROP CONSTRAINT IF EXISTS commission_tiers_tier_number_key;
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_email_key;
ALTER TABLE sales_reps DROP CONSTRAINT IF EXISTS sales_reps_email_key;
ALTER TABLE monthly_company_stats DROP CONSTRAINT IF EXISTS monthly_company_stats_close_month_key;
ALTER TABLE monthly_partner_stats DROP CONSTRAINT IF EXISTS monthly_partner_stats_partner_id_close_month_key;
ALTER TABLE client_nurture_templates DROP CONSTRAINT IF EXISTS client_nurture_templates_campaign_step_key;

CREATE UNIQUE INDEX IF NOT EXISTS partners_org_email_unique ON partners (org_id, lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS partners_org_slug_unique ON partners (org_id, partner_slug);
CREATE INDEX IF NOT EXISTS partners_org_status_idx ON partners (org_id, status) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS fast_start_videos_org_slug_unique ON fast_start_videos (org_id, slug);
CREATE UNIQUE INDEX IF NOT EXISTS commission_tiers_org_tier_number_unique ON commission_tiers (org_id, tier_number);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_org_email_unique ON admin_users (org_id, lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS sales_reps_org_email_unique ON sales_reps (org_id, lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS monthly_company_stats_org_month_unique ON monthly_company_stats (org_id, close_month);
CREATE UNIQUE INDEX IF NOT EXISTS monthly_partner_stats_org_partner_month_unique ON monthly_partner_stats (org_id, partner_id, close_month);
CREATE UNIQUE INDEX IF NOT EXISTS client_nurture_templates_org_step_unique ON client_nurture_templates (org_id, campaign_step);

CREATE INDEX IF NOT EXISTS partner_types_org_idx ON partner_types (org_id);
CREATE INDEX IF NOT EXISTS referrals_org_partner_idx ON referrals (org_id, partner_id);
CREATE INDEX IF NOT EXISTS referrals_org_stage_idx ON referrals (org_id, stage);
CREATE INDEX IF NOT EXISTS referrals_org_client_email_idx ON referrals (org_id, lower(client_email));
CREATE INDEX IF NOT EXISTS commissions_org_partner_month_idx ON commissions (org_id, partner_id, close_month);
CREATE INDEX IF NOT EXISTS commissions_org_state_idx ON commissions (org_id, state);
CREATE INDEX IF NOT EXISTS payouts_org_partner_idx ON payouts (org_id, partner_id);
CREATE INDEX IF NOT EXISTS partner_events_org_partner_idx ON partner_events (org_id, partner_id);
CREATE INDEX IF NOT EXISTS email_sends_org_partner_idx ON email_sends (org_id, partner_id);
CREATE INDEX IF NOT EXISTS sales_reps_org_status_idx ON sales_reps (org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS referral_assignments_org_referral_idx ON referral_assignments (org_id, referral_id);
CREATE INDEX IF NOT EXISTS closer_commissions_org_rep_month_idx ON closer_commissions (org_id, sales_rep_id, close_month);
CREATE INDEX IF NOT EXISTS closer_payouts_org_rep_idx ON closer_payouts (org_id, sales_rep_id);
CREATE INDEX IF NOT EXISTS client_nurture_queue_org_dispatch_idx ON client_nurture_queue (org_id, scheduled_for)
  WHERE sent_at IS NULL AND cancelled_at IS NULL;
CREATE INDEX IF NOT EXISTS client_nurture_sends_org_referral_idx ON client_nurture_sends (org_id, referral_id);
CREATE INDEX IF NOT EXISTS partner_referral_commissions_org_referring_idx ON partner_referral_commissions (org_id, referring_partner_id);
CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_settings_org_unique ON leaderboard_settings (org_id);
CREATE INDEX IF NOT EXISTS partner_leaderboard_opt_in_org_idx ON partner_leaderboard_opt_in (org_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS calendar_availability_org_rep_weekday_idx ON calendar_availability (org_id, sales_rep_id, weekday) WHERE active;
CREATE INDEX IF NOT EXISTS calendar_blocked_times_org_window_idx ON calendar_blocked_times (org_id, sales_rep_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS calendar_bookings_org_rep_schedule_idx ON calendar_bookings (org_id, sales_rep_id, scheduled_for)
  WHERE status IN ('booked', 'rescheduled');
CREATE INDEX IF NOT EXISTS calendar_event_log_org_booking_idx ON calendar_event_log (org_id, booking_id, created_at DESC);

-- Existing round-robin singleton becomes per-org singleton.
ALTER TABLE round_robin_config DROP CONSTRAINT IF EXISTS round_robin_config_pkey;
CREATE UNIQUE INDEX IF NOT EXISTS round_robin_config_org_unique ON round_robin_config (org_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view own org"
  ON orgs FOR SELECT
  USING (id = current_org_id());

CREATE POLICY "Anyone can view OCG branding"
  ON org_branding FOR SELECT
  USING (org_id = '00000000-0000-4000-8000-000000000001'::uuid OR org_id = current_org_id());

-- Tenant integrations are server-side only.

DROP POLICY IF EXISTS "Partners can view own record" ON partners;
DROP POLICY IF EXISTS "Partners can update own record" ON partners;
CREATE POLICY "Partners can view own record"
  ON partners FOR SELECT
  USING (org_id = current_org_id() AND auth_user_id = auth.uid());
CREATE POLICY "Partners can update own record"
  ON partners FOR UPDATE
  USING (org_id = current_org_id() AND auth_user_id = auth.uid())
  WITH CHECK (org_id = current_org_id() AND auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Partners can view own referrals" ON referrals;
DROP POLICY IF EXISTS "Partners can insert referrals" ON referrals;
CREATE POLICY "Partners can view own referrals"
  ON referrals FOR SELECT
  USING (
    org_id = current_org_id()
    AND partner_id IN (SELECT id FROM partners WHERE org_id = current_org_id() AND auth_user_id = auth.uid())
  );
CREATE POLICY "Partners can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (
    org_id = current_org_id()
    AND partner_id IN (SELECT id FROM partners WHERE org_id = current_org_id() AND auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Partners can view own commissions" ON commissions;
CREATE POLICY "Partners can view own commissions"
  ON commissions FOR SELECT
  USING (
    org_id = current_org_id()
    AND partner_id IN (SELECT id FROM partners WHERE org_id = current_org_id() AND auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Partners can view own payouts" ON payouts;
CREATE POLICY "Partners can view own payouts"
  ON payouts FOR SELECT
  USING (
    org_id = current_org_id()
    AND partner_id IN (SELECT id FROM partners WHERE org_id = current_org_id() AND auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Partners can view own video progress" ON partner_video_progress;
DROP POLICY IF EXISTS "Partners can upsert own video progress" ON partner_video_progress;
DROP POLICY IF EXISTS "Partners can update own video progress" ON partner_video_progress;
CREATE POLICY "Partners can view own video progress"
  ON partner_video_progress FOR SELECT
  USING (
    org_id = current_org_id()
    AND partner_id IN (SELECT id FROM partners WHERE org_id = current_org_id() AND auth_user_id = auth.uid())
  );
CREATE POLICY "Partners can upsert own video progress"
  ON partner_video_progress FOR INSERT
  WITH CHECK (
    org_id = current_org_id()
    AND partner_id IN (SELECT id FROM partners WHERE org_id = current_org_id() AND auth_user_id = auth.uid())
  );
CREATE POLICY "Partners can update own video progress"
  ON partner_video_progress FOR UPDATE
  USING (
    org_id = current_org_id()
    AND partner_id IN (SELECT id FROM partners WHERE org_id = current_org_id() AND auth_user_id = auth.uid())
  )
  WITH CHECK (
    org_id = current_org_id()
    AND partner_id IN (SELECT id FROM partners WHERE org_id = current_org_id() AND auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Partners can view own monthly stats" ON monthly_partner_stats;
CREATE POLICY "Partners can view own monthly stats"
  ON monthly_partner_stats FOR SELECT
  USING (
    org_id = current_org_id()
    AND partner_id IN (SELECT id FROM partners WHERE org_id = current_org_id() AND auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can view fast start videos" ON fast_start_videos;
CREATE POLICY "Anyone can view fast start videos"
  ON fast_start_videos FOR SELECT
  USING (org_id = '00000000-0000-4000-8000-000000000001'::uuid OR org_id = current_org_id());

DROP POLICY IF EXISTS "Anyone can view partner types" ON partner_types;
CREATE POLICY "Anyone can view partner types"
  ON partner_types FOR SELECT
  USING (org_id = '00000000-0000-4000-8000-000000000001'::uuid OR org_id = current_org_id());

DROP POLICY IF EXISTS "Anyone can view commission tiers" ON commission_tiers;
CREATE POLICY "Anyone can view commission tiers"
  ON commission_tiers FOR SELECT
  USING (org_id = '00000000-0000-4000-8000-000000000001'::uuid OR org_id = current_org_id());

DROP POLICY IF EXISTS "Sales reps can view own record" ON sales_reps;
CREATE POLICY "Sales reps can view own record"
  ON sales_reps FOR SELECT
  USING (org_id = current_org_id() AND auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Sales reps can view own closer commissions" ON closer_commissions;
CREATE POLICY "Sales reps can view own closer commissions"
  ON closer_commissions FOR SELECT
  USING (
    org_id = current_org_id()
    AND sales_rep_id IN (SELECT id FROM sales_reps WHERE org_id = current_org_id() AND auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Sales reps can view own closer payouts" ON closer_payouts;
CREATE POLICY "Sales reps can view own closer payouts"
  ON closer_payouts FOR SELECT
  USING (
    org_id = current_org_id()
    AND sales_rep_id IN (SELECT id FROM sales_reps WHERE org_id = current_org_id() AND auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can view nurture templates" ON client_nurture_templates;
CREATE POLICY "Anyone can view nurture templates"
  ON client_nurture_templates FOR SELECT
  USING (org_id = '00000000-0000-4000-8000-000000000001'::uuid OR org_id = current_org_id());

-- ============================================================
-- UPDATED MULTI-TENANT FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION assign_referral_round_robin(p_referral_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_existing uuid;
  v_last uuid;
  v_rep uuid;
  v_last_position integer;
BEGIN
  SELECT org_id INTO v_org_id FROM referrals WHERE id = p_referral_id FOR UPDATE;
  IF v_org_id IS NULL THEN RAISE EXCEPTION 'Referral not found'; END IF;

  SELECT sales_rep_id INTO v_existing
  FROM referral_assignments
  WHERE referral_id = p_referral_id AND org_id = v_org_id;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  SELECT last_assigned_rep_id INTO v_last
  FROM round_robin_config
  WHERE org_id = v_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO round_robin_config (org_id, id)
    VALUES (v_org_id, 'default')
    ON CONFLICT (org_id) DO NOTHING;
  END IF;

  WITH active_reps AS (
    SELECT id, row_number() OVER (ORDER BY last_name, first_name, id) AS position
    FROM sales_reps
    WHERE org_id = v_org_id AND status = 'active' AND deleted_at IS NULL
  )
  SELECT position INTO v_last_position FROM active_reps WHERE id = v_last;

  WITH active_reps AS (
    SELECT id, row_number() OVER (ORDER BY last_name, first_name, id) AS position
    FROM sales_reps
    WHERE org_id = v_org_id AND status = 'active' AND deleted_at IS NULL
  )
  SELECT id INTO v_rep FROM active_reps
  WHERE position > COALESCE(v_last_position, 0)
  ORDER BY position LIMIT 1;

  IF v_rep IS NULL THEN
    SELECT id INTO v_rep FROM sales_reps
    WHERE org_id = v_org_id AND status = 'active' AND deleted_at IS NULL
    ORDER BY last_name, first_name, id LIMIT 1;
  END IF;
  IF v_rep IS NULL THEN RAISE EXCEPTION 'No active sales reps are available'; END IF;

  INSERT INTO referral_assignments (org_id, referral_id, sales_rep_id, assigned_by)
  VALUES (v_org_id, p_referral_id, v_rep, 'calendar_round_robin');

  UPDATE round_robin_config
  SET last_assigned_rep_id = v_rep, updated_at = now()
  WHERE org_id = v_org_id;

  RETURN v_rep;
END;
$$;

CREATE OR REPLACE FUNCTION upsert_in_house_calendar_booking(
  p_referral_id uuid,
  p_sales_rep_id uuid,
  p_scheduled_for timestamptz,
  p_duration_min integer,
  p_buffer_after_min integer,
  p_client_timezone text,
  p_ics_uid text,
  p_actor text DEFAULT 'client'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_booking_id uuid;
  v_reschedule boolean := false;
BEGIN
  SELECT org_id INTO v_org_id FROM referrals WHERE id = p_referral_id FOR UPDATE;
  IF v_org_id IS NULL THEN RAISE EXCEPTION 'Referral not found'; END IF;

  PERFORM 1 FROM sales_reps WHERE id = p_sales_rep_id AND org_id = v_org_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sales rep does not belong to referral org'; END IF;

  SELECT id INTO v_booking_id
  FROM calendar_bookings
  WHERE referral_id = p_referral_id AND org_id = v_org_id
  FOR UPDATE;

  IF v_booking_id IS NULL THEN
    INSERT INTO calendar_bookings (
      org_id, referral_id, sales_rep_id, scheduled_for, ends_at, duration_min, buffer_after_min,
      client_timezone, status, ics_uid
    ) VALUES (
      v_org_id, p_referral_id, p_sales_rep_id, p_scheduled_for,
      p_scheduled_for + make_interval(mins => p_duration_min + p_buffer_after_min),
      p_duration_min, p_buffer_after_min,
      p_client_timezone, 'booked', p_ics_uid
    ) RETURNING id INTO v_booking_id;
  ELSE
    v_reschedule := true;
    UPDATE calendar_bookings SET
      sales_rep_id = p_sales_rep_id,
      scheduled_for = p_scheduled_for,
      ends_at = p_scheduled_for + make_interval(mins => p_duration_min + p_buffer_after_min),
      duration_min = p_duration_min,
      buffer_after_min = p_buffer_after_min,
      client_timezone = p_client_timezone,
      status = 'rescheduled',
      reschedule_count = reschedule_count + 1,
      cancelled_reason = NULL
    WHERE id = v_booking_id AND org_id = v_org_id;
  END IF;

  UPDATE referrals SET
    stage = 'booked', booked_at = now(), nurture_stage = 'booked_to_consulted',
    appointment_id = v_booking_id::text, appointment_at = p_scheduled_for,
    appointment_end_at = p_scheduled_for + make_interval(mins => p_duration_min),
    appointment_status = CASE WHEN v_reschedule THEN 'rescheduled' ELSE 'scheduled' END,
    appointment_calendar_id = 'in_house'
  WHERE id = p_referral_id AND org_id = v_org_id;

  INSERT INTO calendar_event_log (org_id, booking_id, event_type, actor, payload)
  VALUES (v_org_id, v_booking_id, CASE WHEN v_reschedule THEN 'rescheduled' ELSE 'created' END, p_actor,
    jsonb_build_object('scheduled_for', p_scheduled_for, 'duration_min', p_duration_min));
  RETURN v_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION cancel_in_house_calendar_booking(
  p_booking_id uuid,
  p_actor text,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_id uuid;
  v_org_id uuid;
BEGIN
  SELECT referral_id, org_id INTO v_referral_id, v_org_id
  FROM calendar_bookings
  WHERE id = p_booking_id
  FOR UPDATE;
  IF v_referral_id IS NULL THEN RAISE EXCEPTION 'Booking not found'; END IF;

  UPDATE calendar_bookings
  SET status = 'cancelled', cancelled_reason = p_reason
  WHERE id = p_booking_id AND org_id = v_org_id;

  UPDATE referrals SET
    stage = 'submitted', nurture_stage = 'submitted_to_booked', appointment_status = 'cancelled'
  WHERE id = v_referral_id AND org_id = v_org_id;

  INSERT INTO calendar_event_log (org_id, booking_id, event_type, actor, payload)
  VALUES (v_org_id, p_booking_id, 'cancelled', p_actor, jsonb_build_object('reason', p_reason));
END;
$$;

REVOKE ALL ON FUNCTION current_org_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_org_id() TO anon;

-- ============================================================
-- LEADERBOARD VIEW: now org-scoped
-- ============================================================

DROP MATERIALIZED VIEW IF EXISTS leaderboard_rankings;

CREATE MATERIALIZED VIEW leaderboard_rankings AS
WITH eligible_submissions AS (
  SELECT DISTINCT ON (r.org_id, lower(r.client_email), date_trunc('day', r.created_at))
    r.org_id,
    r.partner_id,
    r.created_at
  FROM referrals r
  JOIN leaderboard_settings s ON s.org_id = r.org_id
  WHERE s.enabled = true
    AND r.created_at < now() - make_interval(hours => s.anti_gaming_min_age_hours)
    AND r.stage <> 'submitted'
  ORDER BY r.org_id, lower(r.client_email), date_trunc('day', r.created_at), r.created_at
),
submission_totals AS (
  SELECT org_id, partner_id, 'month'::text AS period, COUNT(*)::integer AS submissions_count
  FROM eligible_submissions
  WHERE date_trunc('month', created_at) = date_trunc('month', now())
  GROUP BY org_id, partner_id
  UNION ALL
  SELECT org_id, partner_id, 'all_time'::text AS period, COUNT(*)::integer AS submissions_count
  FROM eligible_submissions
  GROUP BY org_id, partner_id
),
eligible_closes AS (
  SELECT DISTINCT c.org_id, c.partner_id, c.referral_id, r.closed_won_at
  FROM commissions c
  JOIN referrals r ON r.org_id = c.org_id AND r.id = c.referral_id
  WHERE c.state IN ('earned', 'payable', 'paid')
    AND r.closed_won_at IS NOT NULL
),
close_totals AS (
  SELECT org_id, partner_id, 'month'::text AS period, COUNT(*)::integer AS closes_count
  FROM eligible_closes
  WHERE date_trunc('month', closed_won_at) = date_trunc('month', now())
  GROUP BY org_id, partner_id
  UNION ALL
  SELECT org_id, partner_id, 'all_time'::text AS period, COUNT(*)::integer AS closes_count
  FROM eligible_closes
  GROUP BY org_id, partner_id
),
totals AS (
  SELECT
    COALESCE(s.org_id, c.org_id) AS org_id,
    COALESCE(s.partner_id, c.partner_id) AS partner_id,
    COALESCE(s.period, c.period) AS period,
    COALESCE(s.submissions_count, 0) AS submissions_count,
    COALESCE(c.closes_count, 0) AS closes_count
  FROM submission_totals s
  FULL JOIN close_totals c ON c.org_id = s.org_id AND c.partner_id = s.partner_id AND c.period = s.period
)
SELECT
  t.org_id,
  t.partner_id,
  o.display_name,
  o.show_company,
  p.company_name,
  t.period,
  t.submissions_count,
  t.closes_count,
  now() AS refreshed_at
FROM totals t
JOIN partner_leaderboard_opt_in o ON o.org_id = t.org_id AND o.partner_id = t.partner_id
JOIN partners p ON p.org_id = t.org_id AND p.id = t.partner_id
JOIN leaderboard_settings ls ON ls.org_id = t.org_id AND ls.enabled = true
WHERE p.status = 'active' AND p.deleted_at IS NULL;

CREATE UNIQUE INDEX leaderboard_rankings_unique_idx
  ON leaderboard_rankings (org_id, partner_id, period);
CREATE INDEX leaderboard_rankings_period_submissions_idx
  ON leaderboard_rankings (org_id, period, submissions_count DESC, partner_id);
CREATE INDEX leaderboard_rankings_period_closes_idx
  ON leaderboard_rankings (org_id, period, closes_count DESC, partner_id);

CREATE OR REPLACE FUNCTION refresh_leaderboard_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_rankings;
END;
$$;

REVOKE ALL ON FUNCTION refresh_leaderboard_rankings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_leaderboard_rankings() TO service_role;
