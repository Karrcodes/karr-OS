'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Income } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function useIncome() {
    const [income, setIncome] = useState<Income[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile } = useFinanceProfile()

    const fetchIncome = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_income')
            .select('*')
            .eq('profile', activeProfile)
            .order('created_at', { ascending: false })

        if (error) setError(error.message)
        else setIncome(data ?? [])
        setLoading(false)
    }

    const logIncome = async (payload: Omit<Income, 'id' | 'created_at' | 'profile'>) => {
        const { error } = await supabase.from('fin_income').insert({ ...payload, profile: activeProfile })
        if (error) throw error
        await fetchIncome()
    }

    useEffect(() => { fetchIncome() }, [activeProfile])

    return { income, loading, error, logIncome, refetch: fetchIncome }
}
