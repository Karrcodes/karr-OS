'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_FINANCE, MOCK_BUSINESS } from '@/lib/demoData'

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile, refreshTrigger, globalRefresh } = useFinanceProfile()
    const { settings } = useSystemSettings()

    const fetchTransactions = async () => {
        if (settings.is_demo_mode) {
            const mockData = activeProfile === 'business' ? MOCK_BUSINESS.transactions : MOCK_FINANCE.transactions
            setTransactions(mockData.map(t => ({
                ...t,
                profile: activeProfile,
                created_at: new Date().toISOString(),
                pocket_id: t.id.startsWith('d-tx-1') ? 'd-p-2' : null // Just a mock mapping
            })) as any)
            setLoading(false)
            return
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_transactions')
            .select('*')
            .eq('profile', activeProfile)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })

        if (error) setError(error.message)
        else setTransactions(data ?? [])
        setLoading(false)
    }

    const clearTransactions = async () => {
        setLoading(true)
        const { error } = await supabase
            .from('fin_transactions')
            .delete()
            .eq('profile', activeProfile)

        if (error) setError(error.message)
        else {
            setTransactions([])
            globalRefresh()
        }
        setLoading(false)
    }

    const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
        const { error } = await supabase
            .from('fin_transactions')
            .update(updates)
            .eq('id', id)

        if (error) setError(error.message)
        else globalRefresh()
    }

    const deleteTransaction = async (id: string) => {
        const { error } = await supabase
            .from('fin_transactions')
            .delete()
            .eq('id', id)

        if (error) setError(error.message)
        else globalRefresh()
    }

    useEffect(() => { fetchTransactions() }, [activeProfile, refreshTrigger, settings.is_demo_mode])

    return { transactions, loading, error, refetch: fetchTransactions, updateTransaction, deleteTransaction, clearTransactions }
}
