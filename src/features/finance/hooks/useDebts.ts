'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Debt } from '../types/finance.types'

export function useDebts() {
    const [debts, setDebts] = useState<Debt[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDebts = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_debts')
            .select('*')
            .order('created_at', { ascending: true })

        if (error) setError(error.message)
        else setDebts(data ?? [])
        setLoading(false)
    }

    const createDebt = async (debt: Omit<Debt, 'id' | 'created_at'>) => {
        const { error } = await supabase.from('fin_debts').insert(debt)
        if (error) throw error
        await fetchDebts()
    }

    const updateDebt = async (id: string, updates: Partial<Debt>) => {
        const { error } = await supabase.from('fin_debts').update(updates).eq('id', id)
        if (error) throw error
        await fetchDebts()
    }

    const deleteDebt = async (id: string) => {
        const { error } = await supabase.from('fin_debts').delete().eq('id', id)
        if (error) throw error
        await fetchDebts()
    }

    useEffect(() => { fetchDebts() }, [])

    return { debts, loading, error, createDebt, updateDebt, deleteDebt, refetch: fetchDebts }
}
