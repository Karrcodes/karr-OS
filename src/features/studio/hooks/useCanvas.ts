'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CanvasConnection, StudioCanvasEntry, CanvasColor } from '../types/studio.types'

export function useCanvas() {
    const [entries, setEntries] = useState<StudioCanvasEntry[]>([])
    const [connections, setConnections] = useState<CanvasConnection[]>([])
    const [loading, setLoading] = useState(true)
    const posDebounce = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

    const fetchEntries = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('studio_canvas_entries')
            .select('*')
            .eq('is_archived', false)
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false })
        if (error) console.error('Canvas fetch error:', error.message)
        else setEntries((data || []) as StudioCanvasEntry[])
        setLoading(false)
    }, [])

    const fetchConnections = useCallback(async () => {
        const { data, error } = await supabase
            .from('studio_canvas_connections')
            .select('*')
            .order('created_at', { ascending: true })
        if (error) console.error('Canvas connections fetch error:', error.message)
        else setConnections((data || []) as CanvasConnection[])
    }, [])

    useEffect(() => {
        fetchEntries()
        fetchConnections()
    }, [fetchEntries, fetchConnections])

    const createEntry = useCallback(async (data: { title: string; body?: string; tags?: string[]; color?: CanvasColor }) => {
        const { data: inserted, error } = await supabase
            .from('studio_canvas_entries')
            .insert([{
                title: data.title.trim(),
                body: data.body?.trim() || null,
                tags: data.tags || [],
                color: data.color || 'default',
                pinned: false,
            }])
            .select()

        if (error) {
            console.error('Canvas insert error:', error.message, error.code, (error as any).details, (error as any).hint)
            await fetchEntries()
            return
        }
        const newEntry = inserted?.[0]
        if (newEntry) setEntries(prev => [newEntry as StudioCanvasEntry, ...prev])
        else await fetchEntries()
    }, [fetchEntries])

    const updateEntry = useCallback(async (id: string, updates: Partial<StudioCanvasEntry>) => {
        const { data, error } = await supabase
            .from('studio_canvas_entries')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
        if (error) { console.error('Canvas update error:', error.message); return }
        const updated = data?.[0]
        if (updated) setEntries(prev => prev.map(e => e.id === id ? updated as StudioCanvasEntry : e))
    }, [])

    // Debounced position save (fires 400ms after last drag)
    const updateNodePosition = useCallback((id: string, x: number, y: number) => {
        // Optimistic update on state
        setEntries(prev => prev.map(e => e.id === id ? { ...e, web_x: x, web_y: y } : e))
        // Debounce DB write
        if (posDebounce.current[id]) clearTimeout(posDebounce.current[id])
        posDebounce.current[id] = setTimeout(async () => {
            await supabase
                .from('studio_canvas_entries')
                .update({ web_x: x, web_y: y, updated_at: new Date().toISOString() })
                .eq('id', id)
        }, 400)
    }, [])

    const deleteEntry = useCallback(async (id: string) => {
        const { error } = await supabase.from('studio_canvas_entries').delete().eq('id', id)
        if (error) { console.error('Canvas delete error:', error.message); return }
        setEntries(prev => prev.filter(e => e.id !== id))
        setConnections(prev => prev.filter(c => c.from_id !== id && c.to_id !== id))
    }, [])

    const archiveEntry = useCallback(async (id: string) => {
        const { error } = await supabase
            .from('studio_canvas_entries')
            .update({ is_archived: true, updated_at: new Date().toISOString() })
            .eq('id', id)
        if (error) { console.error('Canvas archive error:', error.message); return }
        setEntries(prev => prev.filter(e => e.id !== id))
    }, [])

    const togglePin = useCallback(async (id: string, current: boolean) => {
        await updateEntry(id, { pinned: !current })
    }, [updateEntry])

    // Connections
    const createConnection = useCallback(async (fromId: string, toId: string) => {
        if (fromId === toId) return
        const { data, error } = await supabase
            .from('studio_canvas_connections')
            .insert([{ from_id: fromId, to_id: toId }])
            .select()
        if (error) { console.error('Canvas connection error:', error.message); return }
        const conn = data?.[0]
        if (conn) setConnections(prev => [...prev, conn as CanvasConnection])
    }, [])

    const deleteConnection = useCallback(async (id: string) => {
        const { error } = await supabase.from('studio_canvas_connections').delete().eq('id', id)
        if (error) { console.error('Canvas delete connection error:', error.message); return }
        setConnections(prev => prev.filter(c => c.id !== id))
    }, [])

    return {
        entries, connections, loading,
        createEntry, updateEntry, updateNodePosition, deleteEntry, archiveEntry, togglePin,
        createConnection, deleteConnection,
        refresh: fetchEntries
    }
}
