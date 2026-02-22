-- Add a unique constraint to fin_transactions to prevent duplicate imports from bank feeds
ALTER TABLE fin_transactions ADD CONSTRAINT unique_provider_tx_id UNIQUE (provider, provider_tx_id);

-- If you get an error that the column doesn't exist, ensure your table has provider and provider_tx_id columns:
-- ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS provider TEXT;
-- ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS provider_tx_id TEXT;
