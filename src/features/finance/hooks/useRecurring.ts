'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { RecurringObligation } from '../types/finance.types'

export function useRecurring() {
    const [obligations, setObligations] = useState<RecurringObligation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchObligations = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_recurring')
            .select('*')
            .order('next_due_date', { ascending: true })

        if (error) setError(error.message)
        else setObligations(data ?? [])
        setLoading(false)
    }, [])

    const createObligation = async (obligation: Omit<RecurringObligation, 'id' | 'created_at'>) => {
        const { error } = await supabase.from('fin_recurring').insert(obligation)
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
    }, [fetchObligations])

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
