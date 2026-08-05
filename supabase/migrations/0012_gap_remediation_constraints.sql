-- 0012_gap_remediation_constraints.sql
-- Phase 8 gap remediation (Section 8 of the build blueprint):
--   - Prevent a partner from submitting the same client twice.
--   - Guard the revenue waterfall and commission amounts at the DB layer,
--     not just in application code, so a bug anywhere upstream can't silently
--     corrupt money.
--
-- If this fails on CREATE UNIQUE INDEX, there are existing duplicate
-- (org_id, partner_id, client_email) rows in `referrals` that need manual
-- dedup before this can apply.

CREATE UNIQUE INDEX IF NOT EXISTS referrals_org_partner_client_email_unique
  ON referrals (org_id, partner_id, lower(client_email));

ALTER TABLE referrals
  DROP CONSTRAINT IF EXISTS referrals_waterfall_check;
ALTER TABLE referrals
  ADD CONSTRAINT referrals_waterfall_check CHECK (
    net_revenue_cents IS NULL
    OR (gross_revenue_cents - processing_fee_cents - closer_share_cents) = net_revenue_cents
  );

ALTER TABLE commissions
  DROP CONSTRAINT IF EXISTS commissions_amount_within_net_check;
ALTER TABLE commissions
  ADD CONSTRAINT commissions_amount_within_net_check CHECK (
    amount_cents IS NULL OR net_revenue_cents IS NULL OR amount_cents <= net_revenue_cents
  );
