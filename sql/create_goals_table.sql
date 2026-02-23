-- Create Goals table
CREATE TABLE IF NOT EXISTS sys_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'personal', -- finance, health, career, personal
    status TEXT DEFAULT 'active',     -- active, completed, archived
    target_date DATE,
    priority TEXT DEFAULT 'mid',      -- super, high, mid, low
    timeframe TEXT DEFAULT 'short',   -- short, medium, long
    vision_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Milestones table
CREATE TABLE IF NOT EXISTS sys_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES sys_goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE sys_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sys_milestones ENABLE ROW LEVEL SECURITY;

-- Policies for Goals
CREATE POLICY "Users can view their own goals" ON sys_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON sys_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON sys_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON sys_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for Milestones
-- Milestones are accessible if the parent goal is accessible
CREATE POLICY "Users can view milestones of their goals" ON sys_milestones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sys_goals
            WHERE sys_goals.id = sys_milestones.goal_id 
            AND sys_goals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert milestones for their goals" ON sys_milestones
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sys_goals
            WHERE sys_goals.id = sys_milestones.goal_id 
            AND sys_goals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update milestones of their goals" ON sys_milestones
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sys_goals
            WHERE sys_goals.id = sys_milestones.goal_id 
            AND sys_goals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete milestones of their goals" ON sys_milestones
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM sys_goals
            WHERE sys_goals.id = sys_milestones.goal_id 
            AND sys_goals.user_id = auth.uid()
        )
    );
