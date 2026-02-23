'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '../types/tasks.types'
import { useTasksProfile } from '@/features/tasks/contexts/TasksProfileContext'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_TASKS } from '@/lib/demoData'

const SESSION_STORAGE_KEY = 'karros_demo_tasks'

export function useTasks(category: 'todo' | 'grocery' | 'reminder', profileOverride?: string) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { activeProfile: contextProfile } = useTasksProfile()
    const activeProfile = profileOverride || contextProfile
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
            .order('position', { ascending: false })

        if (error) setError(error.message)
        else setTasks(data ?? [])
        setLoading(false)
    }, [activeProfile, category, settings.is_demo_mode, getSessionTasks, saveSessionTasks])

    const createTask = async (
        title: string,
        priority: 'super' | 'high' | 'mid' | 'low' = 'low',
        due_date?: string,
        amount?: string,
        due_date_mode: 'on' | 'before' | 'range' = 'on',
        end_date?: string,
        recurrence_config: any = {}
    ) => {
        if (settings.is_demo_mode) {
            const newTask: Task = {
                id: `demo-${Date.now()}`,
                title,
                priority,
                due_date,
                due_date_mode,
                end_date,
                recurrence_config,
                amount,
                is_completed: false,
                category,
                profile: activeProfile as any,
                created_at: new Date().toISOString(),
                position: tasks.length > 0 ? Math.max(...tasks.map(t => t.position || 0)) + 1000 : Date.now()
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
            due_date_mode,
            end_date,
            recurrence_config,
            amount,
            profile: activeProfile,
            position: tasks.length > 0 ? Math.max(...tasks.map(t => t.position || 0)) + 1000 : Date.now()
        })
        if (error) throw error
        await fetchTasks()
    }

    const updateTaskPositions = async (orderedTasks: Task[]) => {
        // Calculate new positions: ensure descending order (higher position at index 0)
        // We update the objects directly so the local sort in TaskList doesn't revert them
        const updatedTasks = orderedTasks.map((t, idx) => ({
            ...t,
            position: (orderedTasks.length - idx) * 1000
        }))

        // Update local state immediately for snappy UI
        setTasks(updatedTasks)

        if (settings.is_demo_mode) {
            saveSessionTasks(updatedTasks)
            return
        }

        try {
            // Batch update positions in background
            for (const t of updatedTasks) {
                await supabase.from('fin_tasks').update({ position: t.position }).eq('id', t.id)
            }
        } catch (err) {
            console.error('Failed to persist task positions', err)
            // Optional: refetch on error to revert to DB truth
            await fetchTasks()
        }
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

    const clearCompletedTasks = async () => {
        if (settings.is_demo_mode) {
            const updated = tasks.filter(t => !t.is_completed)
            setTasks(updated)
            saveSessionTasks(updated)
            return
        }
        const { error } = await supabase.from('fin_tasks')
            .delete()
            .eq('profile', activeProfile)
            .eq('category', category)
            .eq('is_completed', true)
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
        clearCompletedTasks,
        editTask,
        updateTaskPositions,
        refetch: fetchTasks
    }
}
