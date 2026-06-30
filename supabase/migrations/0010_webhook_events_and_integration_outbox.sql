-- 0010_webhook_events_and_integration_outbox.sql
-- Section 14: Integration layer, outbound webhooks, integration outbox,
-- delivery retries, dead-lettering, and inbound webhook idempotency.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE outbound_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL CHECK (url ~* '^https?://'),
  events text[] NOT NULL CHECK (array_length(events, 1) > 0),
  secret text NOT NULL DEFAULT (
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  ),
  active boolean NOT NULL DEFAULT true,
  retry_policy jsonb NOT NULL DEFAULT '{"max_attempts": 6}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX outbound_webhooks_org_active_idx
  ON outbound_webhooks (org_id, active);
CREATE INDEX outbound_webhooks_events_idx
  ON outbound_webhooks USING gin (events);

CREATE TRIGGER set_outbound_webhooks_updated_at
  BEFORE UPDATE ON outbound_webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  webhook_id uuid NOT NULL REFERENCES outbound_webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_id uuid NOT NULL,
  payload jsonb NOT NULL,
  attempt_number integer NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  max_attempts integer NOT NULL DEFAULT 6 CHECK (max_attempts BETWEEN 1 AND 12),
  next_attempt_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'dead_lettered')),
  response_code integer,
  response_body text,
  error_message text,
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (webhook_id, event_id)
);

CREATE INDEX webhook_deliveries_due_idx
  ON webhook_deliveries (status, next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX webhook_deliveries_org_status_idx
  ON webhook_deliveries (org_id, status, created_at DESC);
CREATE INDEX webhook_deliveries_webhook_idx
  ON webhook_deliveries (webhook_id, created_at DESC);

CREATE TABLE webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('ghl', 'twilio', 'stripe', 'cal_com', 'resend')),
  external_event_id text NOT NULL,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  payload jsonb,
  UNIQUE (org_id, provider, external_event_id)
);

CREATE INDEX webhook_events_org_provider_idx
  ON webhook_events (org_id, provider, received_at DESC);

CREATE TABLE integration_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('ghl', 'twilio', 'stripe', 'resend', 'cal_com', 'webhook')),
  job_type text NOT NULL,
  aggregate_type text,
  aggregate_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempt_number integer NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  max_attempts integer NOT NULL DEFAULT 6 CHECK (max_attempts BETWEEN 1 AND 12),
  next_attempt_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'dead_lettered', 'skipped')),
  response jsonb,
  error_message text,
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX integration_outbox_due_idx
  ON integration_outbox (status, next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX integration_outbox_org_status_idx
  ON integration_outbox (org_id, status, created_at DESC);
CREATE INDEX integration_outbox_aggregate_idx
  ON integration_outbox (org_id, provider, aggregate_type, aggregate_id);

CREATE TRIGGER set_integration_outbox_updated_at
  BEFORE UPDATE ON integration_outbox FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE outbound_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_outbox ENABLE ROW LEVEL SECURITY;

-- Admin/API access is intentionally through service-role backed route handlers.
