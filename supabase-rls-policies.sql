-- Add team_name column to users table
-- alter table users add column if not exists team_name text;

-- Add squad_confirmed column to users table
-- alter table users add column if not exists squad_confirmed boolean default false;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own row
CREATE POLICY "Users can insert their own row"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can read their own row
CREATE POLICY "Users can read their own row"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own row
CREATE POLICY "Users can update their own row"
ON users
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Users can delete their own row
CREATE POLICY "Users can delete their own row"
ON users
FOR DELETE
USING (auth.uid() = id);

-- Enable RLS on leagues table
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read leagues (for invite code lookup)
CREATE POLICY "Anyone can read leagues"
ON leagues
FOR SELECT
USING (true);

-- Policy: Authenticated users can insert leagues
CREATE POLICY "Authenticated users can insert leagues"
ON leagues
FOR INSERT
WITH CHECK (auth.uid() = commissioner_id);

-- Policy: Users can update their own leagues
CREATE POLICY "Users can update their own leagues"
ON leagues
FOR UPDATE
USING (auth.uid() = commissioner_id);

-- Policy: Users can delete their own leagues
CREATE POLICY "Users can delete their own leagues"
ON leagues
FOR DELETE
USING (auth.uid() = commissioner_id);

-- Enable RLS on league_members table
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own league_members row
CREATE POLICY "Users can insert their own league_members row"
ON league_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read league_members for their leagues
CREATE POLICY "Users can read league_members for their leagues"
ON league_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR league_id IN (
    SELECT id FROM leagues WHERE commissioner_id = auth.uid()
  )
);

-- Policy: Users can update their own league_members row
CREATE POLICY "Users can update their own league_members row"
ON league_members
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own league_members row
CREATE POLICY "Users can delete their own league_members row"
ON league_members
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- ADMIN RLS POLICIES (for AdminPage.jsx)
-- ============================================================================
-- NOTE: The following policies are needed for the admin panel to function:
-- - Admin can insert/update/delete players
-- - Admin can insert/update/delete player_news
-- - Admin can insert/update/delete weekly_picks
-- - Admin can insert/update/delete fixture_difficulty
-- - Admin can update app_settings
--
-- These policies should be implemented using a check for the admin email:
-- auth.email() = 'jamaljohnson29@gmail.com'
-- ============================================================================
