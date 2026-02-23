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
            if (settings.is_demo_mode) {
                const newGoal: Goal = {
                    id: Math.random().toString(36).substr(2, 9),
                    user_id: 'demo-user',
                    title: data.title,
                    description: data.description || null,
                    category: data.category || 'personal',
                    status: 'active',
                    target_date: data.target_date || null,
                    priority: data.priority || 'mid',
                    timeframe: data.timeframe || 'short',
                    vision_image_url: data.vision_image_url,
                    created_at: new Date().toISOString(),
                    milestones: data.milestones?.map((m, idx) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        goal_id: 'new-id',
                        title: m,
                        is_completed: false,
                        position: idx,
                        created_at: new Date().toISOString()
                    }))
                }
                setGoals(prev => [newGoal, ...prev])
                return
            }

            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) return

            const { data: goal, error: goalError } = await supabase
                .from('sys_goals')
                .insert([{
                    user_id: userData.user.id,
                    title: data.title,
                    description: data.description,
                    category: data.category || 'personal',
                    target_date: data.target_date,
                    priority: data.priority || 'mid',
                    timeframe: data.timeframe || 'short',
                    vision_image_url: data.vision_image_url
                }])
                .select()
                .single()

            if (goalError) throw goalError

            if (data.milestones && data.milestones.length > 0) {
                const milestones = data.milestones.map((m, idx) => ({
                    goal_id: goal.id,
                    title: m,
                    position: idx
                }))
                await supabase.from('sys_milestones').insert(milestones)
            }

            await fetchGoals()
        } catch (err: any) {
            setError(err.message)
            throw err
        }
    }

    const updateGoal = async (id: string, updates: Partial<Goal>) => {
        try {
            if (settings.is_demo_mode) {
                setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
                return
            }

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
            if (settings.is_demo_mode) {
                setGoals(prev => prev.filter(g => g.id !== id))
                return
            }

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
