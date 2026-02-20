-- Create table for authorized devices
CREATE TABLE IF NOT EXISTS fin_authorized_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL, -- The "Shield ID" from localStorage
    device_name TEXT NOT NULL,
    authorized_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE fin_authorized_devices ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (since this IS the gate, it will be protected by PIN in code)
-- In a more complex setup, we'd use service roles, but for KarrOS local usage this is fine.
CREATE POLICY "Allow anonymous read" ON fin_authorized_devices FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON fin_authorized_devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON fin_authorized_devices FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON fin_authorized_devices FOR DELETE USING (true);
