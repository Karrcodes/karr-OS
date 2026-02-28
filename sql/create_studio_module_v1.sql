-- Studio Karrtesian Module Schema

-- 1. Projects
CREATE TABLE IF NOT EXISTS studio_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'idea', -- 'idea', 'research', 'active', 'paused', 'shipped', 'archived'
    type TEXT, -- 'article', 'video', 'product', 'event', 'open_source', 'other'
    platforms TEXT[] DEFAULT '{}', -- 'youtube', 'instagram', 'substack', 'tiktok', 'x', 'web'
    cover_url TEXT,
    gtv_featured BOOLEAN DEFAULT false,
    gtv_category TEXT, -- 'innovation', 'impact', 'recognition', 'leadership'
    start_date DATE,
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sparks
CREATE TABLE IF NOT EXISTS studio_sparks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'idea', 'tool', 'item', 'resource', 'event', 'person', 'platform'
    title TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    project_id UUID REFERENCES studio_projects(id) ON DELETE SET NULL,
    price NUMERIC, -- For items/tools
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'acquired', 'dismissed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Content
CREATE TABLE IF NOT EXISTS studio_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES studio_projects(id) ON DELETE SET NULL,
    platform TEXT NOT NULL, -- 'youtube', 'instagram', 'substack', 'tiktok', 'x'
    type TEXT, -- 'video', 'reel', 'post', 'thread', 'article', 'short'
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'idea', -- 'idea', 'scripted', 'filmed', 'edited', 'scheduled', 'published'
    publish_date DATE,
    url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Network
CREATE TABLE IF NOT EXISTS studio_network (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'person', 'community', 'event'
    name TEXT NOT NULL,
    platform TEXT, -- 'instagram', 'linkedin', 'eventbrite', 'twitter', 'other'
    url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'interested', -- 'interested', 'contacted', 'connected', 'attending', 'attended'
    event_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE studio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_network ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (Assuming single user for now, like other modules)
CREATE POLICY "Allow all for authenticated users" ON studio_projects FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON studio_sparks FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON studio_content FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON studio_network FOR ALL TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_studio_projects_status ON studio_projects(status);
CREATE INDEX idx_studio_sparks_type ON studio_sparks(type);
CREATE INDEX idx_studio_content_status ON studio_content(status);
CREATE INDEX idx_studio_content_publish_date ON studio_content(publish_date);
CREATE INDEX idx_studio_network_type ON studio_network(type);
