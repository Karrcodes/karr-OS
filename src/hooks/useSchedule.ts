'use client'

import { useMemo } from 'react'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { useRota } from '@/features/finance/hooks/useRota'
import { isShiftDay } from '@/features/finance/utils/rotaUtils'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'

export interface ScheduleItem {
    id: string
    title: string
    date: Date
    type: 'task' | 'shift' | 'overtime' | 'holiday'
    priority?: string
    is_completed?: boolean
}

export function useSchedule(days: number = 14) {
    const { tasks, loading: tasksLoading } = useTasks('todo')
    const { overrides, loading: rotaLoading } = useRota()
    const { settings } = useSystemSettings()

    const schedule = useMemo(() => {
        const items: ScheduleItem[] = []
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(start.getDate() + days)

        // Add Tasks
        tasks.forEach(task => {
            if (task.due_date) {
                const date = new Date(task.due_date)
                if (date >= start && date <= end) {
                    items.push({
                        id: task.id,
                        title: task.title,
                        date,
                        type: 'task',
                        priority: task.priority,
                        is_completed: task.is_completed
                    })
                }
            }
        })

        // Add Rota & Overrides
        let curr = new Date(start)
        while (curr <= end) {
            const dateStr = curr.toISOString().split('T')[0]
            const override = overrides.find(o => o.date === dateStr)

            if (override) {
                if (override.type === 'overtime' || override.type === 'holiday' || override.type === 'absence') {
                    if (override.type !== 'absence') {
                        items.push({
                            id: override.id,
                            title: override.type.charAt(0).toUpperCase() + override.type.slice(1),
                            date: new Date(curr),
                            type: override.type as any
                        })
                    }
                }
            } else if (isShiftDay(curr)) {
                items.push({
                    id: `shift-${dateStr}`,
                    title: settings.is_demo_mode ? 'Work' : 'Work Shift',
                    date: new Date(curr),
                    type: 'shift'
                })
            }
            curr.setDate(curr.getDate() + 1)
        }

        return items.sort((a, b) => a.date.getTime() - b.date.getTime())
    }, [tasks, overrides, days, settings.is_demo_mode])

    return {
        schedule,
        loading: tasksLoading || rotaLoading
    }
}
