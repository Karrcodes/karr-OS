-- Create fin_task_templates table
CREATE TABLE IF NOT EXISTS public.fin_task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile TEXT NOT NULL DEFAULT 'personal',
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('todo', 'grocery', 'reminder')),
    priority TEXT NOT NULL CHECK (priority IN ('urgent', 'high', 'mid', 'low')),
    strategic_category TEXT CHECK (strategic_category IN ('finance', 'career', 'health', 'personal')),
    amount TEXT,
    due_date_mode TEXT CHECK (due_date_mode IN ('on', 'before', 'range')),
    recurrence_config JSONB,
    estimated_duration INTEGER,
    impact_score INTEGER,
    notes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fin_task_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all templates" ON public.fin_task_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can insert templates" ON public.fin_task_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update templates" ON public.fin_task_templates
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete templates" ON public.fin_task_templates
    FOR DELETE USING (true);
