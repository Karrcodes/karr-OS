-- Convert date column to timestamptz to store exact transaction time
-- First, it might be tied to views or indexes, so we use a robust conversion
ALTER TABLE fin_transactions 
ALTER COLUMN date TYPE TIMESTAMPTZ 
USING date::TIMESTAMPTZ;

-- If you have any existing data that was just YYYY-MM-DD, 
-- it will now be YYYY-MM-DD 00:00:00+00. 
-- Future inserts from Apple Pay will include the full time.
