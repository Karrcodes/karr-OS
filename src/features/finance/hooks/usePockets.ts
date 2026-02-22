'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Pocket } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_FINANCE, MOCK_BUSINESS } from '@/lib/demoData'

export function usePockets() {
    const [pockets, setPockets] = useState<Pocket[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile, refreshTrigger, globalRefresh } = useFinanceProfile()
    const { settings } = useSystemSettings()

    const fetchPockets = async () => {
        if (settings.is_demo_mode) {
            const mockData = activeProfile === 'business' ? MOCK_BUSINESS.pockets : MOCK_FINANCE.pockets
            setPockets(mockData as any)
            setLoading(false)
            return
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_pockets')
            .select('*')
            .eq('profile', activeProfile)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })

        if (error) setError(error.message)
        else setPockets(data ?? [])
        setLoading(false)
    }

    const createPocket = async (pocket: Omit<Pocket, 'id' | 'created_at' | 'profile'>) => {
        const { error } = await supabase.from('fin_pockets').insert({ ...pocket, profile: activeProfile })
        if (error) throw error
        globalRefresh()
    }

    const updatePocket = async (id: string, updates: Partial<Pocket>) => {
        const { error } = await supabase.from('fin_pockets').update(updates).eq('id', id)
        if (error) throw error
        globalRefresh()
    }

    const deletePocket = async (id: string) => {
        const { error } = await supabase.from('fin_pockets').delete().eq('id', id)
        if (error) throw error
        globalRefresh()
    }

    const updatePocketsOrder = async (updates: { id: string; sort_order: number }[]) => {
        // Run updates sequentially to avoid complex batching for now
        for (const update of updates) {
            await supabase.from('fin_pockets').update({ sort_order: update.sort_order }).eq('id', update.id)
        }
        globalRefresh()
    }

    useEffect(() => { fetchPockets() }, [activeProfile, refreshTrigger, settings.is_demo_mode])

    return { pockets, loading, error, createPocket, updatePocket, deletePocket, updatePocketsOrder, refetch: fetchPockets }
}
