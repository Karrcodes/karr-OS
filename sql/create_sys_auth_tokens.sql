-- Table to store Google OAuth tokens for KarrOS Intelligence
CREATE TABLE IF NOT EXISTS sys_auth_tokens (
    user_id TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expiry_date BIGINT,
    token_type TEXT,
    scope TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sys_auth_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Only 'karr' can see/edit tokens
CREATE POLICY "Allow personal access" ON sys_auth_tokens
    FOR ALL USING (user_id = 'karr');
