-- Table to store Monzo OAuth tokens and other finance-related secrets
CREATE TABLE IF NOT EXISTS fin_secrets (
    user_id TEXT NOT NULL,
    service TEXT NOT NULL,
    secret_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, service)
);

-- Enable RLS
ALTER TABLE fin_secrets ENABLE ROW LEVEL SECURITY;

-- Policy: Only 'karr' can see/edit their own secrets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'fin_secrets' AND policyname = 'Allow personal access'
    ) THEN
        CREATE POLICY "Allow personal access" ON fin_secrets
            FOR ALL USING (user_id = 'karr');
    END IF;
END $$;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_fin_secrets_updated_at ON fin_secrets;
CREATE TRIGGER update_fin_secrets_updated_at
    BEFORE UPDATE ON fin_secrets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
