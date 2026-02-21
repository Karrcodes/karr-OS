import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface RoadmapItem {
    id: string
    content: string
    type: 'future' | 'major_update'
    version?: string
    created_at: string
}

export function useRoadmap() {
    const [items, setItems] = useState<RoadmapItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchRoadmap = useCallback(async () => {
        setLoading(true)
        const { data, error: err } = await supabase
            .from('sys_roadmap')
            .select('*')
            .order('created_at', { ascending: false })

        if (err) setError(err.message)
        else setItems(data || [])
        setLoading(false)
    }, [])

    const addRoadmapItem = async (item: Omit<RoadmapItem, 'id' | 'created_at'>) => {
        const { error: err } = await supabase
            .from('sys_roadmap')
            .insert([item])

        if (err) throw err
        await fetchRoadmap()
    }

    const deleteRoadmapItem = async (id: string) => {
        const { error: err } = await supabase
            .from('sys_roadmap')
            .delete()
            .eq('id', id)

        if (err) throw err
        await fetchRoadmap()
    }

    useEffect(() => {
        fetchRoadmap()
    }, [fetchRoadmap])

    return {
        items,
        loading,
        error,
        addRoadmapItem,
        deleteRoadmapItem,
        refetch: fetchRoadmap
    }
}
