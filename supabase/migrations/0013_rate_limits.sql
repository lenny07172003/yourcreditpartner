-- 0013_rate_limits.sql
-- Lightweight rate limiting for /api/public/* endpoints without an external
-- dependency (Upstash). A fixed-window counter per (route, identifier),
-- reset atomically in a single UPSERT so concurrent requests can't race past
-- the limit.

CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count int NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION check_rate_limit(p_key text, p_window_seconds int, p_max int)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO rate_limits (key, window_start, count)
  VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        THEN 1
      ELSE rate_limits.count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        THEN now()
      ELSE rate_limits.window_start
    END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;
