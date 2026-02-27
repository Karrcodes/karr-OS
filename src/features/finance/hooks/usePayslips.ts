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

    const logPayslip = async (payload: Omit<Payslip, 'id' | 'created_at' | 'profile'>, skipAllocation = false) => {
        // 1. Log the payslip record
        const { data: psData, error: psError } = await supabase.from('fin_payslips').insert({ ...payload, profile: activeProfile }).select().single()
        if (psError) throw psError

        // 2. Automated routing to General pocket (if not skipped)
        if (!skipAllocation) {
            const { data: pocketData, error: pocketError } = await supabase
                .from('fin_pockets')
                .select('*')
                .eq('profile', activeProfile)
                .or(`name.ilike.%General%,type.eq.general`)
                .limit(1)

            if (pocketError) {
                console.error('KarrOS Error: Failed to find General pocket for allocation:', pocketError)
                return
            }

            let pocket = pocketData?.[0]

            // Fallback: If not found in current profile, try ANY profile for a match (prefer name or type match)
            if (!pocket) {
                const { data: fbData } = await supabase
                    .from('fin_pockets')
                    .select('*')
                    .or(`name.ilike.%General%,type.eq.general`)
                    .limit(1)
                pocket = fbData?.[0]
            }

            if (pocket) {
                console.log(`KarrOS: Found General pocket "${pocket.name}" (ID: ${pocket.id}, Profile: ${pocket.profile}, Balance: ${pocket.balance}). Allocating £${payload.net_pay}.`)
                // Add to pocket balance (both ledger and current)
                const { error: updError } = await supabase.from('fin_pockets').update({
                    balance: (pocket.balance || 0) + payload.net_pay,
                    current_balance: (pocket.current_balance || 0) + payload.net_pay
                }).eq('id', pocket.id)

                if (updError) {
                    console.error('KarrOS Error: Failed to update General pocket balance:', updError)
                    return
                }

                // Create tracking transaction
                await supabase.from('fin_transactions').insert({
                    type: 'income',
                    amount: payload.net_pay,
                    pocket_id: pocket.id,
                    description: `Payslip: ${payload.employer || 'Salary'}`,
                    date: payload.date,
                    category: 'income',
                    emoji: '💰',
                    profile: activeProfile
                })
            }

            globalRefresh()
        }
    }

    const deletePayslip = async (id: string) => {
        // 1. Fetch payslip to know how much to revert
        const { data: ps } = await supabase.from('fin_payslips').select('*').eq('id', id).single()

        if (ps) {
            // 2. Revert from General pocket
            const { data: pocketData } = await supabase
                .from('fin_pockets')
                .select('*')
                .eq('profile', activeProfile)
                .ilike('name', '%General%')
                .limit(1)

            const pocket = pocketData?.[0]

            if (pocket) {
                await supabase.from('fin_pockets').update({
                    balance: (pocket.balance || 0) - ps.net_pay,
                    current_balance: (pocket.current_balance || 0) - ps.net_pay
                }).eq('id', pocket.id)

                // 3. Find and delete the corresponding transaction if it exists
                // We match by description, date, and amount to be safe
                await supabase.from('fin_transactions')
                    .delete()
                    .eq('profile', activeProfile)
                    .eq('amount', ps.net_pay)
                    .eq('date', ps.date)
                    .ilike('description', `Payslip: ${ps.employer || 'Salary'}`)
            }
        }

        const { error } = await supabase.from('fin_payslips').delete().eq('id', id)
        if (error) throw error
        globalRefresh()
    }

    useEffect(() => { fetchPayslips() }, [activeProfile, refreshTrigger, settings.is_demo_mode])

    return { payslips, loading, error, logPayslip, deletePayslip, refetch: fetchPayslips }
}
