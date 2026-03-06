-- Fix RLS for studio_networks
-- This ensures that both authenticated and anonymous users can create/read entries for now.

ALTER TABLE studio_networks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON studio_networks;
DROP POLICY IF EXISTS "Allow all" ON studio_networks;

CREATE POLICY "Allow all" ON studio_networks 
FOR ALL TO anon, authenticated 
USING (true) 
WITH CHECK (true);
