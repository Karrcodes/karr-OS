CREATE TABLE public.revolut_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  merchant TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'GBP'
);

-- Enable RLS to ensure client-side requests can't tamper with it
ALTER TABLE public.revolut_transactions ENABLE ROW LEVEL SECURITY;

-- Note: No RLS policies are created here as the API route will use the Service Role Key
-- which bypasses RLS. If you need client-side access, you'll need to add policies.
