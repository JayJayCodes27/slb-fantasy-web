-- Migration: add slb_fixtures table for real SLB game results
-- The existing `fixtures` table is used for fantasy league H2H matchups.
-- This table stores actual SLB basketball game fixtures and results.

CREATE TABLE IF NOT EXISTS slb_fixtures (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gameweek_id UUID        REFERENCES gameweeks(id) ON DELETE SET NULL,
  home_team_id UUID       NOT NULL REFERENCES slb_teams(id),
  away_team_id UUID       NOT NULL REFERENCES slb_teams(id),
  home_score  INT         DEFAULT NULL,
  away_score  INT         DEFAULT NULL,
  played_at   TIMESTAMPTZ DEFAULT NULL,
  is_complete BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS slb_fixtures_gameweek_idx ON slb_fixtures (gameweek_id);
CREATE INDEX IF NOT EXISTS slb_fixtures_home_team_idx ON slb_fixtures (home_team_id);
CREATE INDEX IF NOT EXISTS slb_fixtures_away_team_idx ON slb_fixtures (away_team_id);
CREATE INDEX IF NOT EXISTS slb_fixtures_played_at_idx ON slb_fixtures (played_at);

-- Enable Row Level Security
ALTER TABLE slb_fixtures ENABLE ROW LEVEL SECURITY;

-- Anyone can read fixtures (public data)
CREATE POLICY "slb_fixtures_public_read"
  ON slb_fixtures FOR SELECT
  USING (true);

-- Only service role / admin can insert or update
CREATE POLICY "slb_fixtures_admin_write"
  ON slb_fixtures FOR ALL
  USING (auth.role() = 'service_role');
