-- 0006_appointment_tracking.sql — Appointment tracking columns on referrals

ALTER TABLE referrals
  ADD COLUMN appointment_id text,
  ADD COLUMN appointment_at timestamptz,
  ADD COLUMN appointment_end_at timestamptz,
  ADD COLUMN appointment_status text
    CHECK (appointment_status IN ('scheduled','rescheduled','cancelled','completed','no_show')),
  ADD COLUMN appointment_calendar_id text;

CREATE INDEX idx_referrals_appointment_id ON referrals (appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX idx_referrals_appointment_status ON referrals (appointment_status)
  WHERE appointment_status IS NOT NULL;
