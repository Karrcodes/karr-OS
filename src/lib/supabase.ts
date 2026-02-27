import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Gracefully handle missing env vars — UI will render but data won't load
// until you create .env.local with real credentials
let supabaseInstance: SupabaseClient

if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
} else {
    // Stub client that returns empty arrays/null — prevents crashes during dev setup
    supabaseInstance = {
        from: () => ({
            select: () => ({ order: () => ({ data: [], error: null }), data: [], error: null, single: () => ({ data: null, error: null }) }),
            insert: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }), error: null }),
            update: () => ({ eq: async () => ({ error: null }) }),
            delete: () => ({ eq: async () => ({ error: null }) }),
            upsert: async () => ({ error: null }),
        }),
        storage: {
            from: () => ({
                upload: async () => ({ data: {}, error: null }),
                getPublicUrl: () => ({ data: { publicUrl: '/placeholder-image.png' } }),
            })
        }
    } as unknown as SupabaseClient
}

export const supabase = supabaseInstance

