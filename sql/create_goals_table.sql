-- Create Goals table
CREATE TABLE IF NOT EXISTS sys_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Removed foreign key constraint to auth.users
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

-- Drop existing restricted policies
DROP POLICY IF EXISTS "Users can view their own goals" ON sys_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON sys_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON sys_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON sys_goals;
DROP POLICY IF EXISTS "Users can view milestones of their goals" ON sys_milestones;
DROP POLICY IF EXISTS "Users can insert milestones for their goals" ON sys_milestones;
DROP POLICY IF EXISTS "Users can update milestones of their goals" ON sys_milestones;
DROP POLICY IF EXISTS "Users can delete milestones of their goals" ON sys_milestones;

-- Public Policies for Goals (Allows anonymous access)
CREATE POLICY "Public Select Goals" ON sys_goals FOR SELECT USING (true);
CREATE POLICY "Public Insert Goals" ON sys_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Goals" ON sys_goals FOR UPDATE USING (true);
CREATE POLICY "Public Delete Goals" ON sys_goals FOR DELETE USING (true);

-- Public Policies for Milestones
CREATE POLICY "Public Select Milestones" ON sys_milestones FOR SELECT USING (true);
CREATE POLICY "Public Insert Milestones" ON sys_milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Milestones" ON sys_milestones FOR UPDATE USING (true);
CREATE POLICY "Public Delete Milestones" ON sys_milestones FOR DELETE USING (true);
