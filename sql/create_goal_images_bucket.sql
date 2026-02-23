-- Create storage bucket for goal images
-- Run this in the Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public) 
VALUES ('goal-images', 'goal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
DROP POLICY IF EXISTS "Goals Public Access" ON storage.objects;
CREATE POLICY "Goals Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'goal-images' );

DROP POLICY IF EXISTS "Goals Authenticated Upload" ON storage.objects;
CREATE POLICY "Goals Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'goal-images' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Goals Individual Update" ON storage.objects;
CREATE POLICY "Goals Individual Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'goal-images' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Goals Individual Delete" ON storage.objects;
CREATE POLICY "Goals Individual Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'goal-images' AND auth.uid() = owner );
