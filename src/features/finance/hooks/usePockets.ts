'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Pocket } from '../types/finance.types'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_FINANCE, MOCK_BUSINESS } from '@/lib/demoData'

// Module-level locks to prevent race conditions across multiple hook instances
const ensuringProfiles = new Set<string>()

export function usePockets() {
    const [pockets, setPockets] = useState<Pocket[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile, refreshTrigger, globalRefresh } = useFinanceProfile()
    const { settings } = useSystemSettings()

    const fetchPockets = async () => {
        if (settings.is_demo_mode) {
            const mockData = activeProfile === 'business' ? MOCK_BUSINESS.pockets : MOCK_FINANCE.pockets
            setPockets(mockData as any)
            setLoading(false)
            return
        }
        // Only show loading spinner on initial load (when there's no data yet)
        if (pockets.length === 0) setLoading(true)
        const { data, error } = await supabase
            .from('fin_pockets')
            .select('*')
            .eq('profile', activeProfile)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })

        if (error) setError(error.message)
        else setPockets(data ?? [])
        setLoading(false)
    }

    const createPocket = async (pocket: Omit<Pocket, 'id' | 'created_at' | 'profile'>) => {
        const { error } = await supabase.from('fin_pockets').insert({ ...pocket, profile: activeProfile })
        if (error) throw error
        globalRefresh()
    }

    const updatePocket = async (id: string, updates: Partial<Pocket>) => {
        if (settings.is_demo_mode) {
            const currentPockets = [...pockets]
            const index = currentPockets.findIndex(p => p.id === id)
            if (index !== -1) {
                currentPockets[index] = { ...currentPockets[index], ...updates }
                setPockets(currentPockets)
                // Persistence in sessionStorage for demo mode
                const key = activeProfile === 'business' ? 'karr_demo_business_pockets' : 'karr_demo_finance_pockets'
                sessionStorage.setItem(key, JSON.stringify(currentPockets))
            }
            globalRefresh()
            return
        }
        const { error } = await supabase.from('fin_pockets').update(updates).eq('id', id)
        if (error) throw error
        globalRefresh()
    }

    const deletePocket = async (id: string) => {
        const pocket = pockets.find(p => p.id === id)
        if (pocket) {
            const systemKeywords = ['general', 'liabilities']
            const nameLower = pocket.name.toLowerCase()
            const keyword = systemKeywords.find(key => nameLower.includes(key))

            if (keyword) {
                const count = pockets.filter(p => p.name.toLowerCase().includes(keyword)).length
                if (count <= 1) {
                    throw new Error(`The "${pocket.name}" pocket is your only ${keyword} pocket and cannot be deleted.`)
                }
            }
        }
        const { error } = await supabase.from('fin_pockets').delete().eq('id', id)
        if (error) throw error
        globalRefresh()
    }

    const updatePocketsOrder = async (updates: { id: string; sort_order: number }[]) => {
        // Run updates sequentially to avoid complex batching for now
        for (const update of updates) {
            await supabase.from('fin_pockets').update({ sort_order: update.sort_order }).eq('id', update.id)
        }
        globalRefresh()
    }

    const ensureSystemPockets = async () => {
        if (settings.is_demo_mode || !activeProfile || ensuringProfiles.has(activeProfile)) return

        // Prevent other instances from running this concurrently for this profile
        ensuringProfiles.add(activeProfile)

        try {
            const systemPockets = [
                { name: 'General', type: 'general' as const, sort_order: 0 },
                { name: 'Liabilities', type: 'buffer' as const, sort_order: 99 }
            ]

            for (const sp of systemPockets) {
                // Check local state first
                const existsLocally = pockets.some(p => p.name.toLowerCase().includes(sp.name.toLowerCase()))

                if (!existsLocally && !loading) {
                    // Double check with DB to be absolutely sure before inserting
                    const { data: dbCheck } = await supabase
                        .from('fin_pockets')
                        .select('id')
                        .eq('profile', activeProfile)
                        .ilike('name', `%${sp.name}%`)
                        .limit(1)

                    if (!dbCheck || dbCheck.length === 0) {
                        await supabase.from('fin_pockets').insert({
                            ...sp,
                            balance: 0,
                            current_balance: 0,
                            target_budget: 0,
                            profile: activeProfile
                        })
                    }
                }
            }
        } finally {
            // Give some time for DB to propagate before allowing another check
            setTimeout(() => ensuringProfiles.delete(activeProfile!), 5000)
        }
    }

    useEffect(() => {
        fetchPockets()
    }, [activeProfile, refreshTrigger, settings.is_demo_mode])

    useEffect(() => {
        // Run ensure logic whenever loading finishes or profile changes
        if (!loading) ensureSystemPockets()
    }, [loading, activeProfile])

    return { pockets, loading, error, createPocket, updatePocket, deletePocket, updatePocketsOrder, refetch: fetchPockets }
}
