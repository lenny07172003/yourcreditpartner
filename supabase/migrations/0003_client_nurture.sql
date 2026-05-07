-- 0003_client_nurture.sql — Client nurture engine
-- Adds nurture columns to referrals, creates queue/sends/templates tables

-- ============================================================
-- ADD NURTURE COLUMNS TO REFERRALS
-- ============================================================
ALTER TABLE referrals
  ADD COLUMN nurture_status text DEFAULT 'active'
    CHECK (nurture_status IN ('active','paused','completed','opted_out')),
  ADD COLUMN nurture_stage text DEFAULT 'submitted_to_booked'
    CHECK (nurture_stage IN (
      'submitted_to_booked','booked_to_consulted','noshow_recovery',
      'consulted_to_closed','completed','dormant')),
  ADD COLUMN nurture_last_sent_at timestamptz,
  ADD COLUMN nurture_opted_out_at timestamptz,
  ADD COLUMN consult_no_show boolean DEFAULT false;

-- ============================================================
-- CLIENT NURTURE QUEUE (scheduled outbound client emails)
-- ============================================================
CREATE TABLE client_nurture_queue (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id       uuid NOT NULL REFERENCES referrals(id),
  campaign_step     text NOT NULL,
  scheduled_for     timestamptz NOT NULL,
  sent_at           timestamptz,
  cancelled_at      timestamptz,
  cancelled_reason  text,
  resend_message_id text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_nurture_queue_dispatch ON client_nurture_queue (scheduled_for)
  WHERE sent_at IS NULL AND cancelled_at IS NULL;

CREATE INDEX idx_nurture_queue_referral ON client_nurture_queue (referral_id);

-- ============================================================
-- CLIENT NURTURE SENDS (audit log of every client-facing send)
-- ============================================================
CREATE TABLE client_nurture_sends (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id       uuid NOT NULL REFERENCES referrals(id),
  campaign_step     text NOT NULL,
  subject           text,
  sent_at           timestamptz DEFAULT now(),
  delivered_at      timestamptz,
  opened_at         timestamptz,
  clicked_at        timestamptz,
  bounced_at        timestamptz,
  complained_at     timestamptz,
  resend_message_id text
);

CREATE INDEX idx_nurture_sends_referral ON client_nurture_sends (referral_id);

-- ============================================================
-- CLIENT NURTURE TEMPLATES (admin-editable copy)
-- ============================================================
CREATE TABLE client_nurture_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_step   text UNIQUE NOT NULL,
  stage           text NOT NULL,
  delay_minutes   int NOT NULL,
  subject         text NOT NULL,
  preview_text    text,
  body_markdown   text NOT NULL,
  active          boolean DEFAULT true,
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER set_nurture_templates_updated_at
  BEFORE UPDATE ON client_nurture_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE client_nurture_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_nurture_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_nurture_templates ENABLE ROW LEVEL SECURITY;

-- Templates: public read (needed for rendering)
CREATE POLICY "Anyone can view nurture templates"
  ON client_nurture_templates FOR SELECT
  USING (true);

-- Queue and sends: server-side only (no client policies)

-- ============================================================
-- SEED: client_nurture_templates
-- ============================================================

-- Stage 1: SUBMITTED → BOOKED (booking push)
INSERT INTO client_nurture_templates (campaign_step, stage, delay_minutes, subject, body_markdown) VALUES
  ('submitted_h0', 'submitted_to_booked', 0,
   'Your free credit consultation is reserved',
   E'Hi {first_name},\n\nThank you for taking the first step toward better credit. Your free consultation with Opulent Credit Consulting has been reserved.\n\n**Book your call now** to lock in your spot: [Schedule Now]({calendar_link})\n\n{partner_first_name} from {partner_company} referred you because they believe in what we do — and we''re excited to show you what''s possible.\n\nTalk soon,\nThe Opulent Credit Team'),

  ('submitted_d1', 'submitted_to_booked', 1440,
   'What we''ll cover on your call ({first_name})',
   E'Hi {first_name},\n\nOn your free consultation, we''ll review:\n\n- Your current credit situation\n- Specific items that can be addressed\n- A realistic timeline for improvement\n- How our process works (no surprises)\n\nIt takes 15 minutes and there''s zero obligation.\n\n[Book Your Call Now]({calendar_link})\n\nBest,\nThe Opulent Credit Team'),

  ('submitted_d2', 'submitted_to_booked', 2880,
   'Quick question about your credit',
   E'Hi {first_name},\n\nWe noticed you haven''t booked your free consultation yet. We get it — life gets busy.\n\nHere''s the thing: the sooner we look at your credit, the sooner we can start working on it. Most clients see meaningful progress within 60-90 days.\n\n[Pick a time that works for you]({calendar_link})\n\nWe''re here when you''re ready.\n\nBest,\nThe Opulent Credit Team'),

  ('submitted_d4', 'submitted_to_booked', 5760,
   'How a 540 became a 720 in 6 months',
   E'Hi {first_name},\n\nOne of our recent clients came to us with a 540 credit score. They''d been denied for a mortgage twice.\n\nSix months later? 720. Approved. Keys in hand.\n\nYour situation is unique, but the process works. Let us show you what''s possible on a quick call.\n\n[Book Your Free Consultation]({calendar_link})\n\nBest,\nThe Opulent Credit Team'),

  ('submitted_d7', 'submitted_to_booked', 10080,
   'Last chance to claim your consultation slot',
   E'Hi {first_name},\n\nThis is our last reminder about your free credit consultation. We keep spots limited so every client gets personal attention.\n\nIf you''re still interested in improving your credit, now''s the time:\n\n[Claim Your Spot]({calendar_link})\n\nAfter this, we''ll keep your info on file in case you want to reach out later.\n\nBest,\nThe Opulent Credit Team'),

  ('submitted_d14', 'submitted_to_booked', 20160,
   'We''ll keep your info on file',
   E'Hi {first_name},\n\nWe understand the timing might not be right. We''ll keep your information on file so you can reach out whenever you''re ready.\n\nWhen you are, just reply to this email or book directly: [Schedule Anytime]({calendar_link})\n\nWishing you the best,\nThe Opulent Credit Team');

-- Stage 2: BOOKED → CONSULTED (show-up reinforcement)
INSERT INTO client_nurture_templates (campaign_step, stage, delay_minutes, subject, body_markdown) VALUES
  ('booked_confirmation', 'booked_to_consulted', 0,
   'You''re booked for {consult_time} — here''s what to bring',
   E'Hi {first_name},\n\nYou''re confirmed! Here''s what to have ready:\n\n- A recent credit report (we can pull one together if you don''t have it)\n- Any specific goals (home purchase, car loan, business funding, etc.)\n- Questions — we love questions\n\n**Your call: {consult_time}**\n\nSee you there!\nThe Opulent Credit Team'),

  ('booked_24h_before', 'booked_to_consulted', -1440,
   'Tomorrow at {consult_time} — quick prep guide',
   E'Hi {first_name},\n\nJust a friendly reminder — your credit consultation is tomorrow at {consult_time}.\n\nQuick prep:\n1. Be somewhere quiet for 15 minutes\n2. Have your phone or computer ready\n3. Think about your #1 credit goal\n\nWe''re looking forward to helping you.\n\nBest,\nThe Opulent Credit Team'),

  ('booked_morning_of', 'booked_to_consulted', -60,
   'Today at {consult_time} — see you soon',
   E'Hi {first_name},\n\nToday''s the day! Your consultation is at {consult_time}.\n\nWe''ll walk you through exactly what we can do for your credit — no pressure, just clarity.\n\nSee you soon!\nThe Opulent Credit Team');

-- Stage 2.5: NO-SHOW recovery
INSERT INTO client_nurture_templates (campaign_step, stage, delay_minutes, subject, body_markdown) VALUES
  ('noshow_h1', 'noshow_recovery', 60,
   'We missed each other — pick a new time',
   E'Hi {first_name},\n\nLooks like we missed each other today. No worries at all — life happens.\n\nYour consultation is still available. Pick a new time that works better:\n\n[Reschedule Now]({rebook_link})\n\nWe''re here for you.\n\nBest,\nThe Opulent Credit Team'),

  ('noshow_d2', 'noshow_recovery', 2880,
   '{partner_first_name} is rooting for you',
   E'Hi {first_name},\n\n{partner_first_name} referred you because they''ve seen what good credit can unlock. We''d love to help you get there.\n\nRescheduling takes 30 seconds:\n\n[Pick a New Time]({rebook_link})\n\nBest,\nThe Opulent Credit Team'),

  ('noshow_d5', 'noshow_recovery', 7200,
   'Last chance to reschedule',
   E'Hi {first_name},\n\nThis is our final reminder about your credit consultation. If you''d like to reschedule, we''re happy to accommodate:\n\n[Reschedule Now]({rebook_link})\n\nOtherwise, feel free to reach out anytime in the future. We''ll be here.\n\nBest,\nThe Opulent Credit Team');

-- Stage 3: CONSULTED → CLOSED_WON (closing nurture)
INSERT INTO client_nurture_templates (campaign_step, stage, delay_minutes, subject, body_markdown) VALUES
  ('consulted_h1', 'consulted_to_closed', 60,
   'Great talking with you today — proposal inside',
   E'Hi {first_name},\n\nThank you for taking the time to meet with us today. As discussed, here''s a recap:\n\n- We identified several items on your credit report that can be addressed\n- Your estimated timeline: 60-90 days for initial results\n- Your personalized plan is ready to go the moment you say yes\n\nReady to get started? Just reply to this email or give us a call.\n\nBest,\nThe Opulent Credit Team'),

  ('consulted_d1', 'consulted_to_closed', 1440,
   '3 questions clients ask after our call',
   E'Hi {first_name},\n\nAfter consultations, clients often ask:\n\n**1. "How long does it take?"**\nMost clients see meaningful movement in 60-90 days. Some items resolve faster.\n\n**2. "What do I need to do?"**\nVery little. We handle the disputes, monitoring, and follow-up. You just check in periodically.\n\n**3. "Is it worth it?"**\nA 100-point improvement can save you tens of thousands on a mortgage alone.\n\nReady to move forward? Just reply.\n\nBest,\nThe Opulent Credit Team'),

  ('consulted_d4', 'consulted_to_closed', 5760,
   'Quick reminder of what we discussed',
   E'Hi {first_name},\n\nJust checking in. We discussed your credit goals during our consultation, and your personalized plan is ready whenever you are.\n\nThe sooner we start, the sooner you''ll see results.\n\nReply to this email or call us to get started.\n\nBest,\nThe Opulent Credit Team'),

  ('consulted_d7', 'consulted_to_closed', 10080,
   'Spots filling for this month''s cohort',
   E'Hi {first_name},\n\nWe''re getting close to capacity for this month''s new client cohort. If you''d like to start your credit repair journey, now is a great time.\n\nYour consultation notes are on file — we can get you started right away.\n\nJust reply or call us.\n\nBest,\nThe Opulent Credit Team');
