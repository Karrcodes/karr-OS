-- Table: fin_tasks
-- Used for the KarrOS global Tasks module to track general to-dos and grocery lists.

CREATE TABLE fin_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile TEXT NOT NULL DEFAULT 'personal', -- 'personal' or 'business'
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    category TEXT NOT NULL DEFAULT 'todo', -- 'todo' or 'grocery'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE fin_tasks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for local development (adjust for prod)
CREATE POLICY "Allow all operations for anon" ON fin_tasks FOR ALL USING (true);
