-- Fix RLS policy for roster_days table to allow authenticated users to insert/update

-- Drop existing restrictive policy if exists
DROP POLICY IF EXISTS "Allow authenticated users to manage roster_days" ON roster_days;

-- Create new policy that allows authenticated users full access
CREATE POLICY "Allow authenticated users to manage roster_days"
  ON roster_days
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also ensure anon users can read (if needed for public access)
DROP POLICY IF EXISTS "Allow anon users to read roster_days" ON roster_days;
CREATE POLICY "Allow anon users to read roster_days"
  ON roster_days
  FOR SELECT
  TO anon
  USING (true);
