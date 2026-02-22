-- Create sys_notification_logs table
CREATE TABLE IF NOT EXISTS sys_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT,
    icon TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on Row Level Security
ALTER TABLE sys_notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to sys_notification_logs" ON sys_notification_logs
    FOR SELECT USING (true);

-- Allow insert access to authenticated users (used by server actions/API)
CREATE POLICY "Allow insert access to sys_notification_logs" ON sys_notification_logs
    FOR INSERT WITH CHECK (true);

-- Allow delete access to authenticated users
CREATE POLICY "Allow delete access to sys_notification_logs" ON sys_notification_logs
    FOR DELETE USING (true);
