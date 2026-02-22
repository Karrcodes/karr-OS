-- 1. Create system settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS sys_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert initial settings (safe to re-run with ON CONFLICT)
INSERT INTO sys_settings (key, value)
VALUES 
    ('user_name', 'Karr'),
    ('user_email', 'karr@studiokarrtesian.com'),
    ('profile_picture_url', ''),
    ('notification_low_balance', 'true'),
    ('notification_large_transaction', 'true'),
    ('notification_bank_sync', 'true'),
    ('notification_goal_milestone', 'true'),
    ('off_days', '[]'),
    ('last_reminder_sent', ''),
    ('schedule_type', 'mon-fri'),
    ('shift_on_days', '3'),
    ('shift_off_days', '3'),
    ('shift_start_date', '')
ON CONFLICT (key) DO NOTHING;

-- 3. Enable RLS on sys_settings
ALTER TABLE sys_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy (Personal system, so we allow public access for now)
-- Drop existing one if updating script
DROP POLICY IF EXISTS "Enable all access for everyone" ON sys_settings;
CREATE POLICY "Enable all access for everyone" ON sys_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Create storage bucket for system assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('system', 'system', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
    FOR ALL
    USING ( bucket_id = 'system' )
    WITH CHECK ( bucket_id = 'system' );
