-- KarrOS Studio Module Consolidated Updates
-- This script combines all recent schema changes for Projects, Content, Milestones, Sparks, and Networks.
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks).

-- 1. STUDIO PROJECTS & MILESTONES
DO $$ 
BEGIN
    -- Add impact_score to projects
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_projects' AND column_name = 'impact_score') THEN
        ALTER TABLE studio_projects ADD COLUMN impact_score INTEGER DEFAULT 5;
    END IF;

    -- Add is_archived to projects
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_projects' AND column_name = 'is_archived') THEN
        ALTER TABLE studio_projects ADD COLUMN is_archived BOOLEAN DEFAULT false;
    END IF;

    -- Add is_promoted to projects
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_projects' AND column_name = 'is_promoted') THEN
        ALTER TABLE studio_projects ADD COLUMN is_promoted BOOLEAN DEFAULT false;
    END IF;

    -- Add priority to projects
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_projects' AND column_name = 'priority') THEN
        ALTER TABLE studio_projects ADD COLUMN priority TEXT DEFAULT 'mid';
    END IF;

    -- Add ai_position columns for Matrix view
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_projects' AND column_name = 'ai_position_x') THEN
        ALTER TABLE studio_projects ADD COLUMN ai_position_x DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_projects' AND column_name = 'ai_position_y') THEN
        ALTER TABLE studio_projects ADD COLUMN ai_position_y DOUBLE PRECISION;
    END IF;

    -- Add impact_score to milestones
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_milestones' AND column_name = 'impact_score') THEN
        ALTER TABLE studio_milestones ADD COLUMN impact_score INTEGER DEFAULT 5;
    END IF;

    -- Add category to milestones
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_milestones' AND column_name = 'category') THEN
        ALTER TABLE studio_milestones ADD COLUMN category TEXT DEFAULT 'rnd';
    END IF;
END $$;

-- 2. STUDIO CONTENT
DO $$
BEGIN
    -- Add is_archived to content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_content' AND column_name = 'is_archived') THEN
        ALTER TABLE studio_content ADD COLUMN is_archived BOOLEAN DEFAULT false;
    END IF;

    -- Add cover_url and impact_score
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_content' AND column_name = 'cover_url') THEN
        ALTER TABLE studio_content ADD COLUMN cover_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_content' AND column_name = 'impact_score') THEN
        ALTER TABLE studio_content ADD COLUMN impact_score INTEGER DEFAULT 5;
    END IF;

    -- Add deadline and publish_date (if not already there)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_content' AND column_name = 'deadline') THEN
        ALTER TABLE studio_content ADD COLUMN deadline TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_content' AND column_name = 'publish_date') THEN
        ALTER TABLE studio_content ADD COLUMN publish_date TEXT;
    END IF;

    -- Add script field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_content' AND column_name = 'script') THEN
        ALTER TABLE studio_content ADD COLUMN script TEXT;
    END IF;
END $$;

-- 3. STUDIO SPARKS (Status Migration)
-- New statuses: 'inbox', 'review', 'utilized', 'discarded'
UPDATE studio_sparks SET status = 'inbox' WHERE status = 'active';
UPDATE studio_sparks SET status = 'utilized' WHERE status = 'acquired';
UPDATE studio_sparks SET status = 'discarded' WHERE status = 'dismissed';
ALTER TABLE studio_sparks ALTER COLUMN status SET DEFAULT 'inbox';

-- 4. STUDIO NETWORKS (CRM)
CREATE TABLE IF NOT EXISTS studio_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('person', 'community', 'event')),
    name TEXT NOT NULL,
    platform TEXT,
    url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'contacted', 'connected', 'attending', 'attended')),
    event_date TIMESTAMPTZ,
    last_contact TIMESTAMPTZ,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Networks
ALTER TABLE studio_networks ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'studio_networks' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON studio_networks FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Trigger for updated_at (assuming update_updated_at_column function exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_studio_networks_updated_at') THEN
        CREATE TRIGGER update_studio_networks_updated_at
            BEFORE UPDATE ON studio_networks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
