'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Payslip } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_FINANCE } from '@/lib/demoData'

export function usePayslips() {
    const [payslips, setPayslips] = useState<Payslip[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile, refreshTrigger, globalRefresh } = useFinanceProfile()
    const { settings } = useSystemSettings()

    const fetchPayslips = async () => {
        if (settings.is_demo_mode) {
            setPayslips([{
                id: 'd-ps-1',
                date: new Date().toISOString().split('T')[0],
                gross_pay: MOCK_FINANCE.income.raw,
                net_pay: MOCK_FINANCE.income.net,
                employer: 'Work Portal',
                tax_paid: 0,
                pension_contributions: 0,
                student_loan: 0,
                created_at: new Date().toISOString(),
                profile: activeProfile as any
            }])
            setLoading(false)
            return
        }
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

    useEffect(() => { fetchPayslips() }, [activeProfile, refreshTrigger, settings.is_demo_mode])

    return { payslips, loading, error, logPayslip, deletePayslip, refetch: fetchPayslips }
}
