'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_FINANCE, MOCK_BUSINESS } from '@/lib/demoData'
import { ProfileType } from '../types/finance.types'

export function useTransactions(profileOverride?: ProfileType | 'all') {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile: contextProfile, refreshTrigger, globalRefresh } = useFinanceProfile()
    const activeProfile = profileOverride || contextProfile
    const { settings } = useSystemSettings()

    const fetchTransactions = async () => {
        if (settings.is_demo_mode) {
            let mockData: any[] = []
            if (activeProfile === 'all') {
                mockData = [
                    ...MOCK_FINANCE.transactions.map(t => ({ ...t, profile: 'personal' })),
                    ...MOCK_BUSINESS.transactions.map(t => ({ ...t, profile: 'business' }))
                ]
            } else {
                mockData = activeProfile === 'business'
                    ? MOCK_BUSINESS.transactions.map(t => ({ ...t, profile: 'business' }))
                    : MOCK_FINANCE.transactions.map(t => ({ ...t, profile: 'personal' }))
            }

            setTransactions(mockData.map(t => ({
                ...t,
                id: t.id,
                description: t.description,
                amount: t.amount,
                category: t.category,
                type: t.type,
                date: t.date,
                profile: t.profile,
                created_at: new Date().toISOString(),
                pocket_id: t.id.startsWith('d-tx-1') ? 'd-p-2' : (t.pocket_id || null)
            })) as Transaction[])
            setLoading(false)
            return
        }
        // Only show loading spinner on initial load (when there's no data yet)
        if (transactions.length === 0) setLoading(true)
        let query = supabase
            .from('fin_transactions')
            .select('*')
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })

        if (activeProfile !== 'all') {
            query = query.eq('profile', activeProfile)
        }

        const { data, error } = await query

        if (error) setError(error.message)
        else setTransactions(data ?? [])
        setLoading(false)
    }

    const clearTransactions = async () => {
        if (activeProfile === 'all') return // Safety
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
        if (settings.is_demo_mode) {
            const currentTransactions = [...transactions]
            const index = currentTransactions.findIndex(t => t.id === id)
            if (index !== -1) {
                currentTransactions[index] = { ...currentTransactions[index], ...updates }
                setTransactions(currentTransactions)
                const key = activeProfile === 'business' ? 'karr_demo_business_transactions' : 'karr_demo_finance_transactions'
                sessionStorage.setItem(key, JSON.stringify(currentTransactions))
            }
            globalRefresh()
            return
        }
        const { error } = await supabase
            .from('fin_transactions')
            .update(updates)
            .eq('id', id)

        if (error) setError(error.message)
        else globalRefresh()
    }

    const deleteTransaction = async (id: string) => {
        if (settings.is_demo_mode) {
            const updated = transactions.filter(t => t.id !== id)
            setTransactions(updated)
            const key = activeProfile === 'business' ? 'karr_demo_business_transactions' : 'karr_demo_finance_transactions'
            sessionStorage.setItem(key, JSON.stringify(updated))
            globalRefresh()
            return
        }
        const { error } = await supabase
            .from('fin_transactions')
            .delete()
            .eq('id', id)

        if (error) setError(error.message)
        else globalRefresh()
    }

    useEffect(() => { fetchTransactions() }, [activeProfile, refreshTrigger, settings.is_demo_mode])

    return { transactions, loading, error, refetch: fetchTransactions, updateTransaction, deleteTransaction, clearTransactions }
}
