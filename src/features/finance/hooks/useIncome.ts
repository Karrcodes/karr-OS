'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Income } from '../types/finance.types'

export function useIncome() {
    const [income, setIncome] = useState<Income[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchIncome = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_income')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) setError(error.message)
        else setIncome(data ?? [])
        setLoading(false)
    }

    const logIncome = async (payload: Omit<Income, 'id' | 'created_at'>) => {
        const { error } = await supabase.from('fin_income').insert(payload)
        if (error) throw error
        await fetchIncome()
    }

    useEffect(() => { fetchIncome() }, [])

    return { income, loading, error, logIncome, refetch: fetchIncome }
}
