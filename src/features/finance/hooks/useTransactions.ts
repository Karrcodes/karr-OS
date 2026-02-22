'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile, refreshTrigger, globalRefresh } = useFinanceProfile()

    const fetchTransactions = async () => {
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

    useEffect(() => { fetchTransactions() }, [activeProfile, refreshTrigger])

    return { transactions, loading, error, refetch: fetchTransactions, updateTransaction, deleteTransaction, clearTransactions }
}
