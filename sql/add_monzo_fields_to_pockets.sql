-- Migration to add Monzo-specific fields to fin_pockets
ALTER TABLE fin_pockets ADD COLUMN IF NOT EXISTS monzo_id TEXT UNIQUE;
ALTER TABLE fin_pockets ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN fin_pockets.monzo_id IS 'ID of the corresponding Monzo pot or account';
COMMENT ON COLUMN fin_pockets.last_synced_at IS 'Timestamp of the last successful balance sync with Monzo';
