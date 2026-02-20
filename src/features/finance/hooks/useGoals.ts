'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Goal } from '../types/finance.types'

export function useGoals() {
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchGoals = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_goals')
            .select('*')
            .order('created_at', { ascending: true })

        if (error) setError(error.message)
        else setGoals(data ?? [])
        setLoading(false)
    }

    const createGoal = async (goal: Omit<Goal, 'id' | 'created_at'>) => {
        const { error } = await supabase.from('fin_goals').insert(goal)
        if (error) throw error
        await fetchGoals()
    }

    const updateGoal = async (id: string, updates: Partial<Goal>) => {
        const { error } = await supabase.from('fin_goals').update(updates).eq('id', id)
        if (error) throw error
        await fetchGoals()
    }

    const deleteGoal = async (id: string) => {
        const { error } = await supabase.from('fin_goals').delete().eq('id', id)
        if (error) throw error
        await fetchGoals()
    }

    useEffect(() => { fetchGoals() }, [])

    return { goals, loading, error, createGoal, updateGoal, deleteGoal, refetch: fetchGoals }
}
