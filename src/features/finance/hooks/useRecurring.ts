'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { RecurringObligation } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function useRecurring() {
    const [obligations, setObligations] = useState<RecurringObligation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile, refreshTrigger } = useFinanceProfile()

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
    }, [activeProfile, refreshTrigger])

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

    const markObligationAsPaid = async (obligation: RecurringObligation) => {
        if (obligation.payments_left === 1) {
            await deleteObligation(obligation.id)
            return
        }

        const currentNextDue = new Date(obligation.next_due_date)
        let newNextDue = new Date(currentNextDue)

        if (obligation.frequency === 'monthly') {
            const targetMonth = newNextDue.getMonth() + 1
            newNextDue.setMonth(targetMonth)
            if (newNextDue.getMonth() !== ((targetMonth % 12) + 12) % 12) newNextDue.setDate(0)
        } else if (obligation.frequency === 'weekly') {
            newNextDue.setDate(newNextDue.getDate() + 7)
        } else if (obligation.frequency === 'bi-weekly') {
            newNextDue.setDate(newNextDue.getDate() + 14)
        } else if (obligation.frequency === 'yearly') {
            const targetMonth = newNextDue.getMonth() + 12
            newNextDue.setMonth(targetMonth)
            if (newNextDue.getMonth() !== ((targetMonth % 12) + 12) % 12) newNextDue.setDate(0)
        }

        const updates: Partial<RecurringObligation> = {
            next_due_date: newNextDue.toISOString().split('T')[0]
        }

        if (obligation.payments_left != null && obligation.payments_left > 1) {
            updates.payments_left = obligation.payments_left - 1
        }

        await updateObligation(obligation.id, updates)
    }

    useEffect(() => {
        fetchObligations()
    }, [fetchObligations, activeProfile, refreshTrigger])

    return {
        obligations,
        loading,
        error,
        createObligation,
        updateObligation,
        deleteObligation,
        markObligationAsPaid,
        refetch: fetchObligations
    }
}
