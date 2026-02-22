'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '../types/tasks.types'
import { useFinanceProfile } from '@/features/finance/contexts/FinanceProfileContext'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_TASKS } from '@/lib/demoData'

export function useTasks(category: 'todo' | 'grocery' | 'reminder') {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile } = useFinanceProfile()
    const { settings } = useSystemSettings()

    const fetchTasks = useCallback(async () => {
        if (settings.is_demo_mode) {
            setTasks(MOCK_TASKS[category] as any)
            setLoading(false)
            return
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_tasks')
            .select('*')
            .eq('profile', activeProfile)
            .eq('category', category)
            .order('created_at', { ascending: false })

        if (error) setError(error.message)
        else setTasks(data ?? [])
        setLoading(false)
    }, [activeProfile, category, settings.is_demo_mode])

    const createTask = async (title: string, priority: 'super' | 'high' | 'mid' | 'low' = 'low', due_date?: string) => {
        const { error } = await supabase.from('fin_tasks').insert({
            title,
            category,
            priority,
            due_date,
            profile: activeProfile
        })
        if (error) throw error
        await fetchTasks()
    }

    const toggleTask = async (id: string, is_completed: boolean) => {
        const { error } = await supabase.from('fin_tasks').update({ is_completed }).eq('id', id)
        if (error) throw error
        await fetchTasks()
    }

    const editTask = async (id: string, updates: Partial<Task>) => {
        const { error } = await supabase.from('fin_tasks').update(updates).eq('id', id)
        if (error) throw error
        await fetchTasks()
    }

    const deleteTask = async (id: string) => {
        const { error } = await supabase.from('fin_tasks').delete().eq('id', id)
        if (error) throw error
        await fetchTasks()
    }

    const clearAllTasks = async () => {
        const { error } = await supabase.from('fin_tasks')
            .delete()
            .eq('profile', activeProfile)
            .eq('category', category)
        if (error) throw error
        await fetchTasks()
    }

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    return {
        tasks,
        loading,
        error,
        createTask,
        toggleTask,
        deleteTask,
        clearAllTasks,
        editTask,
        refetch: fetchTasks
    }
}
