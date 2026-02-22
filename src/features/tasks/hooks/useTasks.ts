'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '../types/tasks.types'
import { useFinanceProfile } from '@/features/finance/contexts/FinanceProfileContext'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_TASKS } from '@/lib/demoData'

const SESSION_STORAGE_KEY = 'karros_demo_tasks'

export function useTasks(category: 'todo' | 'grocery' | 'reminder') {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile } = useFinanceProfile()
    const { settings } = useSystemSettings()

    const getSessionTasks = useCallback(() => {
        try {
            const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
            if (stored) {
                const allTasks = JSON.parse(stored)
                return allTasks[category] || null
            }
        } catch (e) {
            console.error('Failed to load tasks from session storage', e)
        }
        return null
    }, [category])

    const saveSessionTasks = useCallback((newTasks: Task[]) => {
        try {
            const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
            const allTasks = stored ? JSON.parse(stored) : {}
            allTasks[category] = newTasks
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(allTasks))
        } catch (e) {
            console.error('Failed to save tasks to session storage', e)
        }
    }, [category])

    const fetchTasks = useCallback(async () => {
        if (settings.is_demo_mode) {
            const sessionTasks = getSessionTasks()
            if (sessionTasks) {
                setTasks(sessionTasks)
            } else {
                const initial = (MOCK_TASKS[category] as any).map((t: any) => ({
                    ...t,
                    amount: t.amount || null
                }))
                setTasks(initial)
                saveSessionTasks(initial)
            }
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
    }, [activeProfile, category, settings.is_demo_mode, getSessionTasks, saveSessionTasks])

    const createTask = async (title: string, priority: 'super' | 'high' | 'mid' | 'low' = 'low', due_date?: string, amount?: string) => {
        if (settings.is_demo_mode) {
            const newTask: Task = {
                id: `demo-${Date.now()}`,
                title,
                priority,
                due_date,
                amount,
                is_completed: false,
                category,
                profile: activeProfile as any,
                created_at: new Date().toISOString()
            }
            const updated = [newTask, ...tasks]
            setTasks(updated)
            saveSessionTasks(updated)
            return
        }

        const { error } = await supabase.from('fin_tasks').insert({
            title,
            category,
            priority,
            due_date,
            amount,
            profile: activeProfile
        })
        if (error) throw error
        await fetchTasks()
    }

    const toggleTask = async (id: string, is_completed: boolean) => {
        if (settings.is_demo_mode) {
            const updated = tasks.map(t => t.id === id ? { ...t, is_completed } : t)
            setTasks(updated)
            saveSessionTasks(updated)
            return
        }
        const { error } = await supabase.from('fin_tasks').update({ is_completed }).eq('id', id)
        if (error) throw error
        await fetchTasks()
    }

    const editTask = async (id: string, updates: Partial<Task>) => {
        if (settings.is_demo_mode) {
            const updated = tasks.map(t => t.id === id ? { ...t, ...updates } : t)
            setTasks(updated)
            saveSessionTasks(updated)
            return
        }
        const { error } = await supabase.from('fin_tasks').update(updates).eq('id', id)
        if (error) throw error
        await fetchTasks()
    }

    const deleteTask = async (id: string) => {
        if (settings.is_demo_mode) {
            const updated = tasks.filter(t => t.id !== id)
            setTasks(updated)
            saveSessionTasks(updated)
            return
        }
        const { error } = await supabase.from('fin_tasks').delete().eq('id', id)
        if (error) throw error
        await fetchTasks()
    }

    const clearAllTasks = async () => {
        if (settings.is_demo_mode) {
            setTasks([])
            saveSessionTasks([])
            return
        }
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
