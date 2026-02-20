'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile } = useFinanceProfile()

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
        else setTransactions([])
        setLoading(false)
    }

    useEffect(() => { fetchTransactions() }, [activeProfile])

    return { transactions, loading, error, refetch: fetchTransactions, clearTransactions }
}
