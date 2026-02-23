'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_GOALS, MOCK_MILESTONES } from '@/lib/demoData'
import type { Goal, Milestone, CreateGoalData } from '../types/goals.types'

export function useGoals() {
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { settings } = useSystemSettings()

    const fetchGoals = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            if (settings.is_demo_mode) {
                // In demo mode, we simulate fetching goals with their milestones
                const transformedGoals = MOCK_GOALS.map(goal => ({
                    ...goal,
                    milestones: MOCK_MILESTONES.filter(m => m.goal_id === goal.id)
                })) as Goal[]
                setGoals(transformedGoals)
                setLoading(false)
                return
            }

            // Real data fetch from Supabase
            const { data: goalsData, error: goalsError } = await supabase
                .from('sys_goals')
                .select('*, milestones:sys_milestones(*)')
                .order('created_at', { ascending: false })

            if (goalsError) throw goalsError
            setGoals(goalsData || [])
        } catch (err: any) {
            console.error('Error fetching goals:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [settings.is_demo_mode])

    const createGoal = async (data: CreateGoalData) => {
        try {
            if (settings.is_demo_mode) return // No mutations in demo mode

            const { data: goal, error: goalError } = await supabase
                .from('sys_goals')
                .insert([{
                    title: data.title,
                    description: data.description,
                    category: data.category || 'personal',
                    priority: data.priority || 'mid',
                    target_date: data.target_date,
                    user_id: (await supabase.auth.getUser()).data.user?.id
                }])
                .select()
                .single()

            if (goalError) throw goalError

            if (data.milestones && data.milestones.length > 0) {
                const milestonesToInsert = data.milestones.map((title, index) => ({
                    goal_id: goal.id,
                    title,
                    position: index + 1
                }))
                const { error: mError } = await supabase
                    .from('sys_milestones')
                    .insert(milestonesToInsert)
                if (mError) throw mError
            }

            await fetchGoals()
        } catch (err: any) {
            setError(err.message)
            throw err
        }
    }

    const updateGoal = async (id: string, updates: Partial<Goal>) => {
        try {
            if (settings.is_demo_mode) return

            const { error: goalError } = await supabase
                .from('sys_goals')
                .update(updates)
                .eq('id', id)

            if (goalError) throw goalError
            await fetchGoals()
        } catch (err: any) {
            setError(err.message)
            throw err
        }
    }

    const deleteGoal = async (id: string) => {
        try {
            if (settings.is_demo_mode) return

            const { error: goalError } = await supabase
                .from('sys_goals')
                .delete()
                .eq('id', id)

            if (goalError) throw goalError
            await fetchGoals()
        } catch (err: any) {
            setError(err.message)
            throw err
        }
    }

    const toggleMilestone = async (milestoneId: string, isCompleted: boolean) => {
        try {
            if (settings.is_demo_mode) {
                // For demo mode, we just update local state to feel interactive
                setGoals(prev => prev.map(goal => ({
                    ...goal,
                    milestones: goal.milestones?.map(m =>
                        m.id === milestoneId ? { ...m, is_completed: isCompleted } : m
                    )
                })))
                return
            }

            const { error: mError } = await supabase
                .from('sys_milestones')
                .update({ is_completed: isCompleted })
                .eq('id', milestoneId)

            if (mError) throw mError
            await fetchGoals()
        } catch (err: any) {
            setError(err.message)
            throw err
        }
    }

    useEffect(() => {
        fetchGoals()
    }, [fetchGoals])

    return {
        goals,
        loading,
        error,
        createGoal,
        updateGoal,
        deleteGoal,
        toggleMilestone,
        refetch: fetchGoals
    }
}
