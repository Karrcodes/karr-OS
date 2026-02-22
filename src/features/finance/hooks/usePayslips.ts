'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Payslip } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function usePayslips() {
    const [payslips, setPayslips] = useState<Payslip[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile, refreshTrigger, globalRefresh } = useFinanceProfile()

    const fetchPayslips = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_payslips')
            .select('*')
            .eq('profile', activeProfile)
            .order('date', { ascending: false })

        if (error) setError(error.message)
        else setPayslips(data ?? [])
        setLoading(false)
    }

    const logPayslip = async (payload: Omit<Payslip, 'id' | 'created_at' | 'profile'>) => {
        const { error } = await supabase.from('fin_payslips').insert({ ...payload, profile: activeProfile })
        if (error) throw error
        globalRefresh()
    }

    const deletePayslip = async (id: string) => {
        const { error } = await supabase.from('fin_payslips').delete().eq('id', id)
        if (error) throw error
        globalRefresh()
    }

    useEffect(() => { fetchPayslips() }, [activeProfile, refreshTrigger])

    return { payslips, loading, error, logPayslip, deletePayslip, refetch: fetchPayslips }
}
