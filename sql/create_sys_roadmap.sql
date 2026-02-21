-- Create System Roadmap Table
CREATE TABLE IF NOT EXISTS public.sys_roadmap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('future', 'major_update')),
    version TEXT, -- Only for major_update
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sys_roadmap ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Drop existing the "ALL" policy if it exists to replace with explicit ones
DROP POLICY IF EXISTS "Users can manage roadmap" ON public.sys_roadmap;

CREATE POLICY "Anyone can view roadmap" ON public.sys_roadmap
    FOR SELECT USING (true);

CREATE POLICY "Users can insert roadmap" ON public.sys_roadmap
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update roadmap" ON public.sys_roadmap
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete roadmap" ON public.sys_roadmap
    FOR DELETE USING (true);

-- Insert Initial Major Updates
INSERT INTO public.sys_roadmap (content, type, version, created_at)
VALUES 
('Initial Release: Task management, Basic Finances, and Sidebar navigation.', 'major_update', 'v1.0.0', '2026-02-15T12:00:00Z'),
('Finance Overhaul: Projections, Analytics (salary/spending), and RLS security.', 'major_update', 'v1.1.0', '2026-02-18T12:00:00Z'),
('Sidebar Enhancements: Draggable tabs, sub-tabs, and capability indicators (Personal/Business).', 'major_update', 'v1.2.0', '2026-02-21T12:00:00Z')
ON CONFLICT DO NOTHING;

-- Insert Control Centre Feature Suggestions (Future Features)
INSERT INTO public.sys_roadmap (content, type, created_at)
VALUES 
('Control Centre: Life Score Card - A unified metric for financial health & task productivity.', 'future', NOW()),
('Control Centre: Next 24h View - A timeline aggregating upcoming bills, tasks, and shifts.', 'future', NOW()),
('Control Centre: Efficiency Insights - AI-driven suggestions for time management and habit refinement.', 'future', NOW()),
('Control Centre: Quick Capture - A central portal for notes that AI automatically sorts into proper modules.', 'future', NOW())
ON CONFLICT DO NOTHING;
