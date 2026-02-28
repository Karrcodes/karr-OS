-- Add scenes column to studio_content
ALTER TABLE IF EXISTS studio_content 
ADD COLUMN IF NOT EXISTS scenes JSONB DEFAULT '[]'::JSONB;

-- Add comment for documentation
COMMENT ON COLUMN studio_content.scenes IS 'Array of scene objects for production tracking (Location, Type, Cost, Distance)';
