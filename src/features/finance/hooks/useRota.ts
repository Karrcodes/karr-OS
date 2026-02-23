'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { RotaOverride, ProfileType } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_SCHEDULE } from '@/lib/demoData'

export function useRota(profileOverride?: ProfileType | 'all') {
    const [overrides, setOverrides] = useState<RotaOverride[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile: contextProfile, refreshTrigger } = useFinanceProfile()
    const activeProfile = profileOverride || contextProfile
    const { settings } = useSystemSettings()

    const fetchOverrides = useCallback(async () => {
        if (settings.is_demo_mode) {
            setOverrides([]) // No specific overrides needed for mock data yet
            setLoading(false)
            return
        }
        setLoading(true)
        let query = supabase
            .from('fin_rota_overrides')
            .select('*')
            .order('date', { ascending: true })

        if (activeProfile !== 'all') {
            query = query.eq('profile', activeProfile)
        }

        const { data, error } = await query

        if (error) setError(error.message)
        else setOverrides(data ?? [])
        setLoading(false)
    }, [activeProfile, refreshTrigger, settings.is_demo_mode])

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
