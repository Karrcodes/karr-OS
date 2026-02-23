-- Create storage bucket for goal images
-- Run this in the Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public) 
VALUES ('goal-images', 'goal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
-- 1. Public Read Access
DROP POLICY IF EXISTS "Goals Public Access" ON storage.objects;
CREATE POLICY "Goals Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'goal-images' );

-- 2. Authenticated Upload (INSERT)
DROP POLICY IF EXISTS "Goals Authenticated Upload" ON storage.objects;
CREATE POLICY "Goals Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'goal-images' );

-- 3. Authenticated Update (UPDATE)
DROP POLICY IF EXISTS "Goals Individual Update" ON storage.objects;
CREATE POLICY "Goals Individual Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'goal-images' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'goal-images' AND auth.uid() = owner );

-- 4. Authenticated Delete (DELETE)
DROP POLICY IF EXISTS "Goals Individual Delete" ON storage.objects;
CREATE POLICY "Goals Individual Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'goal-images' AND auth.uid() = owner );
