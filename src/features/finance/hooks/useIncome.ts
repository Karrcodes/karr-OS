'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Income } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_FINANCE } from '@/lib/demoData'

export function useIncome() {
    const [income, setIncome] = useState<Income[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile, refreshTrigger, globalRefresh } = useFinanceProfile()
    const { settings } = useSystemSettings()

    const fetchIncome = async () => {
        if (settings.is_demo_mode) {
            setIncome([{
                id: 'd-inc-1',
                amount: MOCK_FINANCE.income.net,
                source: MOCK_FINANCE.income.label,
                date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString(),
                profile: activeProfile
            }])
            setLoading(false)
            return
        }
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
        globalRefresh()
    }

    useEffect(() => { fetchIncome() }, [activeProfile, refreshTrigger, settings.is_demo_mode])

    return { income, loading, error, logIncome, refetch: fetchIncome }
}
