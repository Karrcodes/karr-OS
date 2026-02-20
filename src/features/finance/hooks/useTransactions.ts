'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '../types/finance.types'

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTransactions = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_transactions')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) setError(error.message)
        else setTransactions(data ?? [])
        setLoading(false)
    }

    useEffect(() => { fetchTransactions() }, [])

    return { transactions, loading, error, refetch: fetchTransactions }
}
