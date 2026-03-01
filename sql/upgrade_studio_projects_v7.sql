-- Upgrade Studio Projects: Add missing columns and migrate categories
DO $$ 
BEGIN
    -- 1. Add impact_score if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_projects' AND column_name = 'impact_score') THEN
        ALTER TABLE studio_projects ADD COLUMN impact_score INTEGER DEFAULT 5;
    END IF;

    -- 2. Add is_archived if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_projects' AND column_name = 'is_archived') THEN
        ALTER TABLE studio_projects ADD COLUMN is_archived BOOLEAN DEFAULT false;
    END IF;

    -- 3. Add is_promoted if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_projects' AND column_name = 'is_promoted') THEN
        ALTER TABLE studio_projects ADD COLUMN is_promoted BOOLEAN DEFAULT false;
    END IF;

    -- 4. Add strategic_category if missing (safety check for previous migrations)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_projects' AND column_name = 'strategic_category') THEN
        ALTER TABLE studio_projects ADD COLUMN strategic_category TEXT DEFAULT 'rnd';
    END IF;

    -- 5. Migrate 'personal' category to 'rnd' and update default
    UPDATE studio_projects SET strategic_category = 'rnd' WHERE strategic_category = 'personal';
    
    -- Change the default for future inserts
    ALTER TABLE studio_projects ALTER COLUMN strategic_category SET DEFAULT 'rnd';

END $$;
