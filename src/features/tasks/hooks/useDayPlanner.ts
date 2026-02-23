'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { useFinanceProfile } from '@/features/finance/contexts/FinanceProfileContext'
import { useRota } from '@/features/finance/hooks/useRota'
import { isShiftDay } from '@/features/finance/utils/rotaUtils'
import { useTasks } from './useTasks'
import type { Task, DayPlannerSettings } from '../types/tasks.types'

export interface PlannerItem {
    id: string
    title: string
    time: string
    type: 'routine' | 'task' | 'shift'
    duration?: number
    is_completed?: boolean
    profile?: string
}

const DEFAULT_SETTINGS: DayPlannerSettings = {
    profile: '',
    wake_up_time_work: '07:00',
    wake_up_time_off: '09:00',
    bed_time_work: '22:30',
    bed_time_off: '00:00',
    meal_times: {
        breakfast: '08:00',
        lunch: '13:00',
        dinner: '19:00'
    },
    workout_duration: 60,
    shower_duration: 15,
    meal_prep_duration: 45
}

export function useDayPlanner(date: Date = new Date()) {
    const [settings, setSettings] = useState<DayPlannerSettings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const { settings: systemSettings } = useSystemSettings()
    const { tasks: personalTasks } = useTasks('todo', 'personal')
    const { tasks: businessTasks } = useTasks('todo', 'business')
    const activeProfile = 'personal' // Default settings to personal profile

    const allTasks = useMemo(() => [...personalTasks, ...businessTasks], [personalTasks, businessTasks])

    const isWorkDay = useMemo(() => isShiftDay(date), [date])

    const fetchSettings = useCallback(async () => {
        if (systemSettings.is_demo_mode) {
            setSettings({ ...DEFAULT_SETTINGS, profile: activeProfile })
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('fin_day_planner_settings')
            .select('*')
            .eq('profile', activeProfile)
            .single()

        if (data) setSettings(data)
        setLoading(false)
    }, [activeProfile, systemSettings.is_demo_mode])

    const updateSettings = async (updates: Partial<DayPlannerSettings>) => {
        if (systemSettings.is_demo_mode) {
            setSettings(prev => ({ ...prev, ...updates }))
            return
        }

        const { error } = await supabase
            .from('fin_day_planner_settings')
            .upsert({ ...settings, ...updates, profile: activeProfile })

        if (error) throw error
        await fetchSettings()
    }

    const plannerItems = useMemo(() => {
        const items: PlannerItem[] = []
        const dateStr = date.toISOString().split('T')[0]

        // 1. Add Routine based on Work/Off
        const wakeTime = isWorkDay ? settings.wake_up_time_work : settings.wake_up_time_off
        const bedTime = isWorkDay ? settings.bed_time_work : settings.bed_time_off

        items.push({ id: 'wake', title: 'Wake Up', time: wakeTime, type: 'routine' })
        items.push({ id: 'shower', title: 'Morning Shower', time: addMinutes(wakeTime, 15), type: 'routine', duration: settings.shower_duration })

        items.push({ id: 'breakfast', title: 'Breakfast', time: settings.meal_times.breakfast, type: 'routine' })
        items.push({ id: 'lunch', title: 'Lunch', time: settings.meal_times.lunch, type: 'routine' })
        items.push({ id: 'dinner', title: 'Dinner', time: settings.meal_times.dinner, type: 'routine' })

        items.push({ id: 'sleep', title: 'Sleep', time: bedTime, type: 'routine' })

        // 2. Add Shift if applicable
        if (isWorkDay) {
            items.push({ id: 'work', title: 'Work Shift', time: '09:00', type: 'shift', duration: 480 })
        }

        // 3. Add Tasks scheduled for this day
        const dayOfWeek = date.getDay() // 0=Sun, 1=Mon...

        allTasks.forEach(task => {
            let shouldInclude = false
            let time = task.recurrence_config?.time || (isWorkDay ? '17:30' : '10:00')
            let duration = task.recurrence_config?.duration_minutes

            // Check direct due date
            if (task.due_date === dateStr) {
                shouldInclude = true
            } else if (task.recurrence_config && task.recurrence_config.type !== 'none') {
                const type = task.recurrence_config.type
                const daysOfWeek = task.recurrence_config.days_of_week || []

                if (type === 'daily') shouldInclude = true
                else if (type === 'work_days' && isWorkDay) shouldInclude = true
                else if (type === 'off_days' && !isWorkDay) shouldInclude = true
                else if (type === 'custom' && daysOfWeek.includes(dayOfWeek)) shouldInclude = true

                // Legacy fallback support
                if ((type as any) === 'shift_relative') {
                    if ((task.recurrence_config as any).target === 'off_days' && !isWorkDay) shouldInclude = true
                    if ((task.recurrence_config as any).target === 'on_days' && isWorkDay) shouldInclude = true
                }
            }

            if (shouldInclude) {
                items.push({
                    id: task.recurrence_config?.type && task.recurrence_config.type !== 'none' ? `${task.id}-${dateStr}` : task.id,
                    title: task.title,
                    time,
                    type: 'task',
                    is_completed: task.is_completed,
                    profile: task.profile,
                    duration
                })
            }
        })

        return items.sort((a, b) => a.time.localeCompare(b.time))
    }, [date, settings, allTasks, isWorkDay])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    return {
        settings,
        loading,
        plannerItems,
        updateSettings,
        isWorkDay
    }
}

function addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(h, m + mins)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
