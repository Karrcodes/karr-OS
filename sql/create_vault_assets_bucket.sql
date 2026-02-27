-- Create a bucket for vault assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault_assets', 'vault_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated and anon users to upload to the vault_assets bucket
-- This ensures KarrOS works even if Supabase Auth isn't fully set up for the current session.
DROP POLICY IF EXISTS "Public Access for authenticated users" ON storage.objects;

CREATE POLICY "Allow public uploads" 
ON storage.objects FOR ALL 
TO public
USING (bucket_id = 'vault_assets') 
WITH CHECK (bucket_id = 'vault_assets');
