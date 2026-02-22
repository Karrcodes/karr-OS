-- Create system settings table
CREATE TABLE IF NOT EXISTS sys_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial settings (optional)
INSERT INTO sys_settings (key, value)
VALUES 
    ('user_name', 'Karr'),
    ('user_email', 'karr@studiokarrtesian.com'),
    ('profile_picture_url', ''),
    ('notification_low_balance', 'true'),
    ('notification_large_transaction', 'true'),
    ('notification_bank_sync', 'true'),
    ('notification_goal_milestone', 'true')
ON CONFLICT (key) DO NOTHING;
