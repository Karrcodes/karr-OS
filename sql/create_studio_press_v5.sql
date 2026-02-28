-- REVISED: Studio Press & Achievements
DROP TABLE IF EXISTS studio_press;

CREATE TABLE studio_press (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    organization TEXT NOT NULL, -- The publication, award body, or community
    type TEXT NOT NULL CHECK (type IN ('competition', 'grant', 'award', 'feature', 'accelerator', 'other')),
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'applying', 'submitted', 'achieved', 'lost', 'closed', 'published', 'rejected')),
    requirements TEXT,
    deadline TIMESTAMPTZ,
    date_achieved TIMESTAMPTZ,
    url TEXT,
    notes TEXT,
    milestone_goal TEXT, -- Strategizing how to get featured/win
    is_strategy_goal BOOLEAN DEFAULT false, -- If this is a key objective for the user
    is_portfolio_item BOOLEAN DEFAULT false, -- For GTV Portfolio
    gtv_category TEXT CHECK (gtv_category IN ('innovation', 'impact', 'recognition')),
    project_id UUID REFERENCES studio_projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE studio_press ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON studio_press FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_studio_press_updated_at
    BEFORE UPDATE ON studio_press
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
