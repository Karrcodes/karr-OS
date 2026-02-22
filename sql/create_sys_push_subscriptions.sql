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

-- Unique index to support upsert based on the endpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_endpoint ON sys_push_subscriptions ((subscription->>'endpoint'));

-- RPC for structured upsert (handles the JSONB logic better than PostgREST)
CREATE OR REPLACE FUNCTION upsert_push_subscription(p_subscription JSONB, p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO sys_push_subscriptions (subscription, user_id, updated_at)
    VALUES (p_subscription, p_user_id, NOW())
    ON CONFLICT ((subscription->>'endpoint'))
    DO UPDATE SET 
        subscription = EXCLUDED.subscription,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
