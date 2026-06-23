-- 0007_leaderboard.sql -- Opt-in partner leaderboard (single-org phase)
-- The multi-tenant version of this schema will add org_id in the tenancy retrofit.

CREATE TABLE leaderboard_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  show_submissions boolean NOT NULL DEFAULT true,
  show_closes boolean NOT NULL DEFAULT true,
  public_widget boolean NOT NULL DEFAULT false,
  top_n integer NOT NULL DEFAULT 25 CHECK (top_n BETWEEN 1 AND 100),
  anti_gaming_min_age_hours integer NOT NULL DEFAULT 24 CHECK (anti_gaming_min_age_hours BETWEEN 1 AND 168),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO leaderboard_settings (id) VALUES (gen_random_uuid());

CREATE TABLE partner_leaderboard_opt_in (
  partner_id uuid PRIMARY KEY REFERENCES partners(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(trim(display_name)) BETWEEN 2 AND 60),
  show_company boolean NOT NULL DEFAULT false,
  opted_in_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_leaderboard_opt_in_updated_at ON partner_leaderboard_opt_in (updated_at DESC);

ALTER TABLE leaderboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_leaderboard_opt_in ENABLE ROW LEVEL SECURITY;

-- All leaderboard reads/writes go through authenticated server routes. This keeps
-- opted-out partners and their performance private at the database boundary.

CREATE TRIGGER set_leaderboard_settings_updated_at
  BEFORE UPDATE ON leaderboard_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_partner_leaderboard_opt_in_updated_at
  BEFORE UPDATE ON partner_leaderboard_opt_in
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE MATERIALIZED VIEW leaderboard_rankings AS
WITH settings AS (
  SELECT anti_gaming_min_age_hours FROM leaderboard_settings LIMIT 1
),
eligible_submissions AS (
  SELECT DISTINCT ON (lower(r.client_email), date_trunc('day', r.created_at))
    r.partner_id,
    r.created_at
  FROM referrals r
  CROSS JOIN settings s
  WHERE r.created_at < now() - make_interval(hours => s.anti_gaming_min_age_hours)
    AND r.stage <> 'submitted'
  ORDER BY lower(r.client_email), date_trunc('day', r.created_at), r.created_at
),
submission_totals AS (
  SELECT partner_id, 'month'::text AS period, COUNT(*)::integer AS submissions_count
  FROM eligible_submissions
  WHERE date_trunc('month', created_at) = date_trunc('month', now())
  GROUP BY partner_id
  UNION ALL
  SELECT partner_id, 'all_time'::text AS period, COUNT(*)::integer AS submissions_count
  FROM eligible_submissions
  GROUP BY partner_id
),
eligible_closes AS (
  SELECT DISTINCT c.partner_id, c.referral_id, r.closed_won_at
  FROM commissions c
  JOIN referrals r ON r.id = c.referral_id
  WHERE c.state IN ('earned', 'payable', 'paid')
    AND r.closed_won_at IS NOT NULL
),
close_totals AS (
  SELECT partner_id, 'month'::text AS period, COUNT(*)::integer AS closes_count
  FROM eligible_closes
  WHERE date_trunc('month', closed_won_at) = date_trunc('month', now())
  GROUP BY partner_id
  UNION ALL
  SELECT partner_id, 'all_time'::text AS period, COUNT(*)::integer AS closes_count
  FROM eligible_closes
  GROUP BY partner_id
),
totals AS (
  SELECT
    COALESCE(s.partner_id, c.partner_id) AS partner_id,
    COALESCE(s.period, c.period) AS period,
    COALESCE(s.submissions_count, 0) AS submissions_count,
    COALESCE(c.closes_count, 0) AS closes_count
  FROM submission_totals s
  FULL JOIN close_totals c ON c.partner_id = s.partner_id AND c.period = s.period
)
SELECT
  t.partner_id,
  o.display_name,
  o.show_company,
  p.company_name,
  t.period,
  t.submissions_count,
  t.closes_count,
  now() AS refreshed_at
FROM totals t
JOIN partner_leaderboard_opt_in o ON o.partner_id = t.partner_id
JOIN partners p ON p.id = t.partner_id
JOIN leaderboard_settings ls ON ls.enabled = true
WHERE p.status = 'active' AND p.deleted_at IS NULL;

CREATE UNIQUE INDEX leaderboard_rankings_unique_idx
  ON leaderboard_rankings (partner_id, period);
CREATE INDEX leaderboard_rankings_period_submissions_idx
  ON leaderboard_rankings (period, submissions_count DESC, partner_id);
CREATE INDEX leaderboard_rankings_period_closes_idx
  ON leaderboard_rankings (period, closes_count DESC, partner_id);

CREATE OR REPLACE FUNCTION refresh_leaderboard_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_rankings;
END;
$$;

REVOKE ALL ON FUNCTION refresh_leaderboard_rankings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_leaderboard_rankings() TO service_role;
