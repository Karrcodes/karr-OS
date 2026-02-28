-- Studio Networks & CRM Schema
DROP TABLE IF EXISTS studio_networks;

CREATE TABLE studio_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('person', 'community', 'event')),
    name TEXT NOT NULL,
    platform TEXT, -- e.g., LinkedIn, Twitter, Email
    url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'contacted', 'connected', 'attending', 'attended')),
    event_date TIMESTAMPTZ,
    last_contact TIMESTAMPTZ,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE studio_networks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON studio_networks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_studio_networks_updated_at
    BEFORE UPDATE ON studio_networks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
