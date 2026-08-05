-- 0011_platform_tenant_signup.sql
-- Phase 12 groundwork: platform-level admin role (distinct from per-tenant
-- admin_users) and a lead/signup record for new orgs created through
-- /platform/get-started. Billing (subscriptions, usage_meters, invoices) is
-- intentionally deferred until Stripe is wired up.

CREATE TABLE IF NOT EXISTS platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) UNIQUE,
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id),
  company_name text NOT NULL,
  admin_first_name text NOT NULL,
  admin_last_name text NOT NULL,
  admin_email text NOT NULL,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'provisioned'
    CHECK (status IN ('provisioned', 'active', 'churned')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_signups ENABLE ROW LEVEL SECURITY;

-- Both tables are server-side only (service role); no public/authenticated
-- RLS policies are needed since all access goes through admin API routes.
