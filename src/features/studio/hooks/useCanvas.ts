'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StudioCanvasEntry, CanvasColor } from '../types/studio.types'

export function useCanvas() {
    const [entries, setEntries] = useState<StudioCanvasEntry[]>([])
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async () => {
        const { data, error } = await supabase
            .from('studio_canvas_entries')
            .select('*')
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false })
        if (!error && data) setEntries(data as StudioCanvasEntry[])
        setLoading(false)
    }, [])

    useEffect(() => {
        fetch()
        const sub = supabase
            .channel('canvas_entries_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'studio_canvas_entries' }, fetch)
            .subscribe()
        return () => { supabase.removeChannel(sub) }
    }, [fetch])

    const createEntry = useCallback(async (data: { title: string; body?: string; tags?: string[]; color?: CanvasColor }) => {
        const { error } = await supabase.from('studio_canvas_entries').insert({
            title: data.title.trim(),
            body: data.body?.trim() || null,
            tags: data.tags || [],
            color: data.color || 'default',
            pinned: false,
        })
        if (!error) fetch()
    }, [fetch])

    const updateEntry = useCallback(async (id: string, updates: Partial<StudioCanvasEntry>) => {
        const { error } = await supabase
            .from('studio_canvas_entries')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
        if (!error) fetch()
    }, [fetch])

    const deleteEntry = useCallback(async (id: string) => {
        await supabase.from('studio_canvas_entries').delete().eq('id', id)
        fetch()
    }, [fetch])

    const togglePin = useCallback(async (id: string, current: boolean) => {
        await updateEntry(id, { pinned: !current })
    }, [updateEntry])

    return { entries, loading, createEntry, updateEntry, deleteEntry, togglePin }
}
