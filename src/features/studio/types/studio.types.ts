export type ProjectStatus = 'idea' | 'research' | 'active' | 'paused' | 'shipped' | 'archived';
export type ProjectType = 'article' | 'video' | 'product' | 'event' | 'open_source' | 'other';
export type Platform = 'youtube' | 'instagram' | 'substack' | 'tiktok' | 'x' | 'web';

export interface StudioProject {
    id: string;
    title: string;
    tagline?: string;
    description?: string;
    status: ProjectStatus;
    type?: ProjectType;
    platforms?: Platform[];
    cover_url?: string;
    gtv_featured: boolean;
    gtv_category?: 'innovation' | 'impact' | 'recognition' | 'leadership';
    start_date?: string;
    target_date?: string;
    created_at: string;
    updated_at: string;
}

export type SparkType = 'idea' | 'tool' | 'item' | 'resource' | 'event' | 'person' | 'platform';
export type SparkStatus = 'active' | 'acquired' | 'dismissed';

export interface StudioSpark {
    id: string;
    type: SparkType;
    title: string;
    url?: string;
    notes?: string;
    tags?: string[];
    project_id?: string;
    price?: number;
    status: SparkStatus;
    created_at: string;
    updated_at: string;
}

export type ContentStatus = 'idea' | 'scripted' | 'filmed' | 'edited' | 'scheduled' | 'published';

export interface StudioContent {
    id: string;
    project_id?: string;
    platform: Platform;
    type?: string;
    title: string;
    status: ContentStatus;
    publish_date?: string;
    url?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export type NetworkType = 'person' | 'community' | 'event';
export type NetworkStatus = 'interested' | 'contacted' | 'connected' | 'attending' | 'attended';

export interface StudioNetwork {
    id: string;
    type: NetworkType;
    name: string;
    platform?: string;
    url?: string;
    notes?: string;
    status: NetworkStatus;
    event_date?: string;
    created_at: string;
    updated_at: string;
}

export interface StudioMilestone {
    id: string;
    project_id: string;
    title: string;
    description?: string;
    status: 'pending' | 'completed';
    completed_at?: string;
    target_date?: string;
    created_at: string;
    updated_at: string;
}
