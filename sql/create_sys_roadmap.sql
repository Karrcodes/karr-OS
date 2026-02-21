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
CREATE POLICY "Anyone can view roadmap" ON public.sys_roadmap
    FOR SELECT USING (true);

CREATE POLICY "Users can manage roadmap" ON public.sys_roadmap
    FOR ALL USING (true); -- Usually restricted, but for personal OS we allow

-- Insert Initial Major Updates based on our progress
INSERT INTO public.sys_roadmap (content, type, version, created_at)
VALUES 
('Initial Release: Task management, Basic Finances, and Sidebar navigation.', 'major_update', 'v1.0.0', '2026-02-15T12:00:00Z'),
('Finance Overhaul: Projections, Analytics (salary/spending), and RLS security.', 'major_update', 'v1.1.0', '2026-02-18T12:00:00Z'),
('Sidebar Enhancements: Draggable tabs, sub-tabs, and capability indicators (Personal/Business).', 'major_update', 'v1.2.0', '2026-02-21T12:00:00Z');
