-- 0008_in_house_calendar.sql -- Core in-house booking engine (single-org phase)

CREATE TABLE calendar_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,
  weekday integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  buffer_before_min integer NOT NULL DEFAULT 5 CHECK (buffer_before_min BETWEEN 0 AND 120),
  buffer_after_min integer NOT NULL DEFAULT 5 CHECK (buffer_after_min BETWEEN 0 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE UNIQUE INDEX calendar_availability_unique_rule
  ON calendar_availability (sales_rep_id, weekday, start_time, end_time);
CREATE INDEX calendar_availability_rep_weekday_idx
  ON calendar_availability (sales_rep_id, weekday) WHERE active;

CREATE TABLE calendar_blocked_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id uuid REFERENCES sales_reps(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX calendar_blocked_times_window_idx
  ON calendar_blocked_times (sales_rep_id, starts_at, ends_at);

CREATE TABLE calendar_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL UNIQUE REFERENCES referrals(id) ON DELETE CASCADE,
  sales_rep_id uuid NOT NULL REFERENCES sales_reps(id),
  scheduled_for timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 30 CHECK (duration_min BETWEEN 15 AND 180),
  buffer_after_min integer NOT NULL DEFAULT 5 CHECK (buffer_after_min BETWEEN 0 AND 120),
  client_timezone text NOT NULL,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'rescheduled', 'cancelled', 'no_show', 'attended')),
  ics_uid text NOT NULL UNIQUE,
  reschedule_count integer NOT NULL DEFAULT 0,
  external_event_id text,
  external_provider text CHECK (external_provider IN ('ghl', 'cal_com')),
  cancelled_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > scheduled_for)
);

CREATE INDEX calendar_bookings_rep_schedule_idx
  ON calendar_bookings (sales_rep_id, scheduled_for)
  WHERE status IN ('booked', 'rescheduled');
CREATE INDEX calendar_bookings_status_schedule_idx
  ON calendar_bookings (status, scheduled_for);

-- A database-level overlap guard prevents two clients booking the same closer slot.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE calendar_bookings ADD CONSTRAINT calendar_bookings_no_overlap
  EXCLUDE USING gist (
    sales_rep_id WITH =,
    tstzrange(scheduled_for, ends_at, '[)') WITH &&
  ) WHERE (status IN ('booked', 'rescheduled'));

CREATE TABLE calendar_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES calendar_bookings(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created', 'rescheduled', 'cancelled', 'marked_attended', 'marked_no_show')),
  actor text NOT NULL CHECK (actor IN ('client', 'closer', 'admin', 'cron', 'system')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX calendar_event_log_booking_idx ON calendar_event_log (booking_id, created_at DESC);

ALTER TABLE calendar_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_log ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_calendar_availability_updated_at
  BEFORE UPDATE ON calendar_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_calendar_bookings_updated_at
  BEFORE UPDATE ON calendar_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Assign a submitted referral to the next active closer, safely under concurrent bookings.
CREATE OR REPLACE FUNCTION assign_referral_round_robin(p_referral_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing uuid;
  v_last uuid;
  v_rep uuid;
  v_last_position integer;
BEGIN
  SELECT sales_rep_id INTO v_existing FROM referral_assignments WHERE referral_id = p_referral_id;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  PERFORM 1 FROM referrals WHERE id = p_referral_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Referral not found'; END IF;

  -- Re-check after the referral lock: another request may have assigned it
  -- between the initial read and acquiring the lock.
  SELECT sales_rep_id INTO v_existing FROM referral_assignments WHERE referral_id = p_referral_id;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  SELECT last_assigned_rep_id INTO v_last FROM round_robin_config WHERE id = 'default' FOR UPDATE;

  WITH active_reps AS (
    SELECT id, row_number() OVER (ORDER BY last_name, first_name, id) AS position
    FROM sales_reps
    WHERE status = 'active' AND deleted_at IS NULL
  )
  SELECT position INTO v_last_position FROM active_reps WHERE id = v_last;

  WITH active_reps AS (
    SELECT id, row_number() OVER (ORDER BY last_name, first_name, id) AS position
    FROM sales_reps
    WHERE status = 'active' AND deleted_at IS NULL
  )
  SELECT id INTO v_rep FROM active_reps
  WHERE position > COALESCE(v_last_position, 0)
  ORDER BY position LIMIT 1;

  IF v_rep IS NULL THEN
    SELECT id INTO v_rep FROM sales_reps
    WHERE status = 'active' AND deleted_at IS NULL
    ORDER BY last_name, first_name, id LIMIT 1;
  END IF;
  IF v_rep IS NULL THEN RAISE EXCEPTION 'No active sales reps are available'; END IF;

  INSERT INTO referral_assignments (referral_id, sales_rep_id, assigned_by)
  VALUES (p_referral_id, v_rep, 'calendar_round_robin');
  UPDATE round_robin_config SET last_assigned_rep_id = v_rep, updated_at = now() WHERE id = 'default';
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
  v_booking_id uuid;
  v_reschedule boolean := false;
BEGIN
  PERFORM 1 FROM referrals WHERE id = p_referral_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Referral not found'; END IF;

  SELECT id INTO v_booking_id FROM calendar_bookings WHERE referral_id = p_referral_id FOR UPDATE;
  IF v_booking_id IS NULL THEN
    INSERT INTO calendar_bookings (
      referral_id, sales_rep_id, scheduled_for, ends_at, duration_min, buffer_after_min,
      client_timezone, status, ics_uid
    ) VALUES (
      p_referral_id, p_sales_rep_id, p_scheduled_for,
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
    WHERE id = v_booking_id;
  END IF;

  UPDATE referrals SET
    stage = 'booked', booked_at = now(), nurture_stage = 'booked_to_consulted',
    appointment_id = v_booking_id::text, appointment_at = p_scheduled_for,
    appointment_end_at = p_scheduled_for + make_interval(mins => p_duration_min),
    appointment_status = CASE WHEN v_reschedule THEN 'rescheduled' ELSE 'scheduled' END,
    appointment_calendar_id = 'in_house'
  WHERE id = p_referral_id;

  INSERT INTO calendar_event_log (booking_id, event_type, actor, payload)
  VALUES (v_booking_id, CASE WHEN v_reschedule THEN 'rescheduled' ELSE 'created' END, p_actor,
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
DECLARE v_referral_id uuid;
BEGIN
  SELECT referral_id INTO v_referral_id FROM calendar_bookings WHERE id = p_booking_id FOR UPDATE;
  IF v_referral_id IS NULL THEN RAISE EXCEPTION 'Booking not found'; END IF;
  UPDATE calendar_bookings SET status = 'cancelled', cancelled_reason = p_reason WHERE id = p_booking_id;
  UPDATE referrals SET
    stage = 'submitted', nurture_stage = 'submitted_to_booked', appointment_status = 'cancelled'
  WHERE id = v_referral_id;
  INSERT INTO calendar_event_log (booking_id, event_type, actor, payload)
  VALUES (p_booking_id, 'cancelled', p_actor, jsonb_build_object('reason', p_reason));
END;
$$;

REVOKE ALL ON FUNCTION assign_referral_round_robin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION upsert_in_house_calendar_booking(uuid, uuid, timestamptz, integer, integer, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION cancel_in_house_calendar_booking(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION assign_referral_round_robin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION upsert_in_house_calendar_booking(uuid, uuid, timestamptz, integer, integer, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION cancel_in_house_calendar_booking(uuid, text, text) TO service_role;
