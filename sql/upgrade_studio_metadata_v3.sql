-- Upgrade Studio Module: Multi-Platform Content & Enhanced Metadata

-- 1. Upgrade studio_content table
DO $$ 
BEGIN
    -- Rename platform to platforms and change type to text array
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_content' AND column_name = 'platform') THEN
        ALTER TABLE studio_content RENAME COLUMN platform TO platform_old;
        ALTER TABLE studio_content ADD COLUMN platforms TEXT[] DEFAULT '{}';
        UPDATE studio_content SET platforms = ARRAY[platform_old];
        ALTER TABLE studio_content DROP COLUMN platform_old;
    END IF;

    -- Add Priority, Impact, and Category to studio_content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_content' AND column_name = 'priority') THEN
        ALTER TABLE studio_content ADD COLUMN priority TEXT DEFAULT 'mid';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_content' AND column_name = 'impact') THEN
        ALTER TABLE studio_content ADD COLUMN impact TEXT DEFAULT 'mid';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_content' AND column_name = 'category') THEN
        ALTER TABLE studio_content ADD COLUMN category TEXT DEFAULT 'Other';
    END IF;

    -- 2. Upgrade studio_projects table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'studio_projects' AND column_name = 'impact') THEN
        ALTER TABLE studio_projects ADD COLUMN impact TEXT DEFAULT 'mid';
    END IF;
END $$;
