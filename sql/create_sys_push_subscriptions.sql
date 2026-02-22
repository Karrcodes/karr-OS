-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS sys_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription JSONB NOT NULL,
    user_id TEXT DEFAULT 'karr', -- Default for personal OS
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON sys_push_subscriptions(user_id);
