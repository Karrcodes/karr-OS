-- Create storage bucket for goal images
-- Run this in the Supabase SQL Editor

-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('goal-images', 'goal-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Clear out any old/conflicting policies for this bucket
DROP POLICY IF EXISTS "Goals Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Goals Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Goals Individual Update" ON storage.objects;
DROP POLICY IF EXISTS "Goals Individual Delete" ON storage.objects;
DROP POLICY IF EXISTS "Goals Full Access for Auth" ON storage.objects;
DROP POLICY IF EXISTS "Goals Public Full Access" ON storage.objects;

-- 3. Public Read Access
CREATE POLICY "Goals Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'goal-images' );

-- 4. Full Access for ALL Users (Public/Anonymous)
-- This allows anyone to upload and manage goal images, bypassing auth requirements
CREATE POLICY "Goals Public Full Access"
ON storage.objects FOR ALL
TO public
USING ( bucket_id = 'goal-images' )
WITH CHECK ( bucket_id = 'goal-images' );
