-- 0005_partner_email_and_referral_commission.sql
-- Adds partner email drip tracking + partner-to-partner referral commission structure

-- ============================================================
-- PARTNER EMAIL DRIP TRACKING
-- ============================================================
ALTER TABLE partners
  ADD COLUMN welcome_drip_step int DEFAULT 0,
  ADD COLUMN last_nudge_sent_at timestamptz,
  ADD COLUMN last_tip_sent_at timestamptz,
  ADD COLUMN last_tip_index int DEFAULT 0,
  ADD COLUMN last_digest_month text;

-- ============================================================
-- PARTNER REFERRAL TRACKING (who referred whom)
-- ============================================================
-- referred_by_partner_id: the partner who recruited this partner
-- When Partner B (this row) earns a commission, Partner A (referred_by)
-- earns 5% of that commission amount — paid by the company, not deducted.
ALTER TABLE partners
  ADD COLUMN referred_by_partner_id uuid REFERENCES partners(id);

CREATE INDEX idx_partners_referred_by ON partners (referred_by_partner_id)
  WHERE referred_by_partner_id IS NOT NULL;

-- ============================================================
-- PARTNER REFERRAL COMMISSIONS
-- Tracks the 5% override commissions earned by referring partners
-- ============================================================
CREATE TABLE partner_referral_commissions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_commission_id  uuid NOT NULL REFERENCES commissions(id),
  referring_partner_id  uuid NOT NULL REFERENCES partners(id),
  earning_partner_id    uuid NOT NULL REFERENCES partners(id),
  override_rate         numeric(5,4) NOT NULL DEFAULT 0.05,
  amount_cents          int NOT NULL,
  state                 text NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','earned','payable','paid','voided')),
  earned_at             timestamptz,
  payable_at            timestamptz,
  paid_at               timestamptz,
  payout_id             uuid REFERENCES payouts(id),
  voided_reason         text,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_prc_referring ON partner_referral_commissions (referring_partner_id);
CREATE INDEX idx_prc_source ON partner_referral_commissions (source_commission_id);

ALTER TABLE partner_referral_commissions ENABLE ROW LEVEL SECURITY;
