-- 0002_closers.sql — Sales rep / closer system
-- Tables: sales_reps, referral_assignments, closer_commissions,
--         closer_payouts, monthly_company_stats

-- ============================================================
-- SALES REPS
-- ============================================================
CREATE TABLE sales_reps (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id      uuid REFERENCES auth.users(id) UNIQUE,
  email             text UNIQUE NOT NULL,
  first_name        text NOT NULL,
  last_name         text NOT NULL,
  phone             text,
  status            text DEFAULT 'active' CHECK (status IN ('active','paused','terminated')),
  commission_rate   numeric DEFAULT 0.15,
  zelle_handle      text,
  hire_date         date,
  notes_internal    text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  deleted_at        timestamptz
);

CREATE TRIGGER set_sales_reps_updated_at
  BEFORE UPDATE ON sales_reps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- REFERRAL ASSIGNMENTS (1 closer per referral)
-- ============================================================
CREATE TABLE referral_assignments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id       uuid NOT NULL REFERENCES referrals(id) UNIQUE,
  sales_rep_id      uuid NOT NULL REFERENCES sales_reps(id),
  assigned_at       timestamptz DEFAULT now(),
  assigned_by       text,
  locked_at         timestamptz,
  reassigned_count  int DEFAULT 0
);

CREATE INDEX idx_referral_assignments_rep ON referral_assignments (sales_rep_id);

-- ============================================================
-- CLOSER PAYOUTS
-- ============================================================
CREATE TABLE closer_payouts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id      uuid NOT NULL REFERENCES sales_reps(id),
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
-- CLOSER COMMISSIONS
-- ============================================================
CREATE TABLE closer_commissions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id             uuid NOT NULL REFERENCES referrals(id),
  sales_rep_id            uuid NOT NULL REFERENCES sales_reps(id),
  close_month             date NOT NULL,
  gross_revenue_cents     bigint NOT NULL,
  processing_fee_cents    bigint NOT NULL,
  base_after_processing   bigint NOT NULL,
  commission_rate         numeric NOT NULL,
  amount_cents            bigint NOT NULL,
  state                   text DEFAULT 'pending' CHECK (state IN (
                            'pending','earned','payable','paid','voided')),
  earned_at               timestamptz,
  payable_at              timestamptz,
  paid_at                 timestamptz,
  payout_id               uuid REFERENCES closer_payouts(id),
  voided_reason           text,
  created_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_closer_commissions_rep_month ON closer_commissions (sales_rep_id, close_month);
CREATE INDEX idx_closer_commissions_state ON closer_commissions (state);
CREATE INDEX idx_closer_commissions_referral ON closer_commissions (referral_id);

-- ============================================================
-- MONTHLY COMPANY STATS (aggregate per month)
-- ============================================================
CREATE TABLE monthly_company_stats (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  close_month                     date UNIQUE NOT NULL,
  total_revenue_cents             bigint DEFAULT 0,
  total_partner_commission_cents  bigint DEFAULT 0,
  total_closer_commission_cents   bigint DEFAULT 0,
  close_count                     int DEFAULT 0,
  active_partner_count            int DEFAULT 0,
  finalized                       boolean DEFAULT false,
  finalized_at                    timestamptz,
  updated_at                      timestamptz DEFAULT now()
);

CREATE TRIGGER set_monthly_company_stats_updated_at
  BEFORE UPDATE ON monthly_company_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROUND-ROBIN CONFIG (tracks last assigned rep)
-- ============================================================
CREATE TABLE round_robin_config (
  id                    text PRIMARY KEY DEFAULT 'default',
  last_assigned_rep_id  uuid REFERENCES sales_reps(id),
  updated_at            timestamptz DEFAULT now()
);

INSERT INTO round_robin_config (id) VALUES ('default');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Sales reps: server-side managed, reps can view own record
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales reps can view own record"
  ON sales_reps FOR SELECT
  USING (auth_user_id = auth.uid());

-- Referral assignments: server-side only
ALTER TABLE referral_assignments ENABLE ROW LEVEL SECURITY;

-- Closer commissions: rep-scoped read
ALTER TABLE closer_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales reps can view own closer commissions"
  ON closer_commissions FOR SELECT
  USING (sales_rep_id IN (SELECT id FROM sales_reps WHERE auth_user_id = auth.uid()));

-- Closer payouts: rep-scoped read
ALTER TABLE closer_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales reps can view own closer payouts"
  ON closer_payouts FOR SELECT
  USING (sales_rep_id IN (SELECT id FROM sales_reps WHERE auth_user_id = auth.uid()));

-- Monthly company stats: server-side only (admin dashboard)
ALTER TABLE monthly_company_stats ENABLE ROW LEVEL SECURITY;

-- Round robin config: server-side only
ALTER TABLE round_robin_config ENABLE ROW LEVEL SECURITY;
