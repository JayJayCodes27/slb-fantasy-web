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
