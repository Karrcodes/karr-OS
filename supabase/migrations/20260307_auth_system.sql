-- =============================================
-- Schrö Auth System - Supabase SQL Migration
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Beta Invites Table
CREATE TABLE IF NOT EXISTS beta_invites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    email text,                                          -- pre-assign to specific email, or null for generic
    claimed_by uuid REFERENCES auth.users(id),
    claimed_at timestamptz,
    max_claims int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. User Profiles Table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    display_name text,
    avatar_url text,
    status text NOT NULL DEFAULT 'waitlist'             -- 'waitlist' | 'beta' | 'admin'
        CHECK (status IN ('waitlist', 'beta', 'admin')),
    modules_enabled jsonb NOT NULL DEFAULT '{
        "finance": false,
        "studio": false,
        "goals": false,
        "vault": false,
        "intelligence": false
    }'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Row Level Security (keep tables private by default)
ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (display_name, avatar_url only)
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Service role can do everything (for server-side code)
-- This is handled automatically by using the service role key

-- 4. Create your first invite code (replace with your desired code)
INSERT INTO beta_invites (code, max_claims)
VALUES ('SCHRO-BETA-01', 10)   -- 10-use shared beta code
ON CONFLICT (code) DO NOTHING;

-- 5. (Optional) Pre-assign codes to specific people
-- INSERT INTO beta_invites (code, email, max_claims)
-- VALUES ('FRIEND-CODE', 'friend@example.com', 1)
-- ON CONFLICT (code) DO NOTHING;
