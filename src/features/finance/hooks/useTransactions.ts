'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_FINANCE } from '@/lib/demoData'

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile, refreshTrigger, globalRefresh } = useFinanceProfile()
    const { settings } = useSystemSettings()

    const fetchTransactions = async () => {
        if (settings.is_demo_mode) {
            const now = new Date()
            const midMonth = new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0]
            setTransactions([
                {
                    id: 'd-t-sync-1',
                    amount: MOCK_FINANCE.income.net,
                    type: 'income',
                    description: MOCK_FINANCE.income.label,
                    date: midMonth,
                    pocket_id: null,
                    category: 'Salary',
                    emoji: '💰',
                    profile: activeProfile,
                    created_at: new Date().toISOString()
                },
                {
                    id: 'd-t-sync-2',
                    amount: 45.00,
                    type: 'spend',
                    description: 'Tesco Superstore',
                    date: new Date().toISOString().split('T')[0],
                    pocket_id: 'd-p-2',
                    category: 'Groceries',
                    emoji: '🛒',
                    profile: activeProfile,
                    created_at: new Date().toISOString()
                }
            ] as any)
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
