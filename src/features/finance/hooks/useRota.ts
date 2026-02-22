'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { RotaOverride } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function useRota() {
    const [overrides, setOverrides] = useState<RotaOverride[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile, refreshTrigger } = useFinanceProfile()

    const fetchOverrides = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_rota_overrides')
            .select('*')
            .eq('profile', activeProfile)
            .order('date', { ascending: true })

        if (error) setError(error.message)
        else setOverrides(data ?? [])
        setLoading(false)
    }, [activeProfile, refreshTrigger])

    const saveOverrides = async (items: Omit<RotaOverride, 'id' | 'created_at' | 'profile'>[]) => {
        if (items.length === 0) return
        const { error } = await supabase.from('fin_rota_overrides').upsert(
            items.map(item => ({ ...item, profile: activeProfile })),
            { onConflict: 'date,profile' }
        )
        if (error) throw error
        await fetchOverrides()
    }

    const updateOverrideStatus = async (id: string, status: 'pending' | 'approved') => {
        const { error } = await supabase
            .from('fin_rota_overrides')
            .update({ status })
            .eq('id', id)
            .eq('profile', activeProfile)

        if (error) throw error
        await fetchOverrides()
    }

    const deleteOverrideByDate = async (date: string) => {
        const { error } = await supabase
            .from('fin_rota_overrides')
            .delete()
            .eq('date', date)
            .eq('profile', activeProfile)

        if (error) throw error
        await fetchOverrides()
    }

    useEffect(() => { fetchOverrides() }, [fetchOverrides])

    return {
        overrides,
        loading,
        error,
        saveOverrides,
        updateOverrideStatus,
        deleteOverrideByDate,
        refetch: fetchOverrides
    }
}
