'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { FinanceSetting } from '../types/finance.types'

export function useSettings() {
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)

    const fetchSettings = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('fin_settings')
            .select('*')

        const map: Record<string, string> = {}
            ; (data as FinanceSetting[] ?? []).forEach((s) => { map[s.key] = s.value })
        setSettings(map)
        setLoading(false)
    }, [])

    const setSetting = async (key: string, value: string) => {
        await supabase
            .from('fin_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() })
        setSettings((prev) => ({ ...prev, [key]: value }))
    }

    useEffect(() => { fetchSettings() }, [fetchSettings])

    return { settings, loading, setSetting, refetch: fetchSettings }
}
