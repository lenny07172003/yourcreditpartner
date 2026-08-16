-- 0014_super_admin_and_seats.sql
-- Super Admin (platform-level) reporting + per-company partner seat billing.
--
-- `platform_admins` already exists (0011) but nothing in the app uses it yet.
-- This migration adds the columns needed to tell companies apart from
-- individually-sold partners, and to gate partner creation on paid seats.

ALTER TABLE orgs ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'company'
  CHECK (kind IN ('company', 'individual'));

ALTER TABLE orgs ADD COLUMN IF NOT EXISTS included_partner_slots int NOT NULL DEFAULT 4;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS purchased_additional_slots int NOT NULL DEFAULT 0;

-- OCG itself is the platform operator, not a sold company — mark it distinctly
-- so Super Admin reporting can exclude it from "companies sold" counts.
UPDATE orgs SET kind = 'company', included_partner_slots = 999999
  WHERE id = '00000000-0000-4000-8000-000000000001';
