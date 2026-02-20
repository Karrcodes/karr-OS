'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { RecurringObligation } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function useRecurring() {
    const [obligations, setObligations] = useState<RecurringObligation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile } = useFinanceProfile()

    const fetchObligations = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_recurring')
            .select('*')
            .eq('profile', activeProfile)
            .order('next_due_date', { ascending: true })

        if (error) setError(error.message)
        else setObligations(data ?? [])
        setLoading(false)
    }, [])

    const createObligation = async (obligation: Omit<RecurringObligation, 'id' | 'created_at' | 'profile'>) => {
        const { error } = await supabase.from('fin_recurring').insert({ ...obligation, profile: activeProfile })
        if (error) throw error
        await fetchObligations()
    }

    const updateObligation = async (id: string, updates: Partial<RecurringObligation>) => {
        const { error } = await supabase.from('fin_recurring').update(updates).eq('id', id)
        if (error) throw error
        await fetchObligations()
    }

    const deleteObligation = async (id: string) => {
        const { error } = await supabase.from('fin_recurring').delete().eq('id', id)
        if (error) throw error
        await fetchObligations()
    }

    useEffect(() => {
        fetchObligations()
    }, [fetchObligations, activeProfile])

    return {
        obligations,
        loading,
        error,
        createObligation,
        updateObligation,
        deleteObligation,
        refetch: fetchObligations
    }
}
