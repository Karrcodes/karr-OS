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
    const { tasks: todoTasks, loading: todoLoading } = useTasks('todo')
    const { tasks: reminderTasks, loading: reminderLoading } = useTasks('reminder')
    const { overrides, loading: rotaLoading } = useRota()
    const { settings } = useSystemSettings()

    const schedule = useMemo(() => {
        const items: ScheduleItem[] = []
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(start.getDate() + days)

        const allTasks = [...todoTasks, ...reminderTasks]

        // Add Tasks
        const currDate = new Date(start)
        const dateRange: Date[] = []
        for (let i = 0; i < days; i++) {
            const d = new Date(currDate)
            d.setDate(currDate.getDate() + i)
            dateRange.push(d)
        }

        allTasks.forEach(task => {
            // 1. Handle Recurring (Shift Relative)
            if (task.recurrence_config?.type === 'shift_relative') {
                dateRange.forEach(d => {
                    const isShift = isShiftDay(d)
                    const targetMatch = (task.recurrence_config?.target === 'off_days' && !isShift) ||
                        (task.recurrence_config?.target === 'on_days' && isShift);

                    if (targetMatch) {
                        items.push({
                            id: `${task.id}-${d.toISOString()}`,
                            title: task.title,
                            date: d,
                            type: 'task',
                            priority: task.priority,
                            is_completed: task.is_completed
                        })
                    }
                })
                return
            }

            // 2. Handle Simple/Range/Before
            if (task.due_date) {
                const startDate = new Date(task.due_date)
                startDate.setHours(0, 0, 0, 0)

                if (task.due_date_mode === 'range' && task.end_date) {
                    const endDate = new Date(task.end_date)
                    endDate.setHours(23, 59, 59, 999)

                    dateRange.forEach(d => {
                        if (d >= startDate && d <= endDate) {
                            items.push({
                                id: `${task.id}-${d.toISOString()}`,
                                title: `[Range] ${task.title}`,
                                date: d,
                                type: 'task',
                                priority: task.priority,
                                is_completed: task.is_completed
                            })
                        }
                    })
                } else if (task.due_date_mode === 'before') {
                    if (startDate >= start && startDate <= end) {
                        items.push({
                            id: task.id,
                            title: `[By] ${task.title}`,
                            date: startDate,
                            type: 'task',
                            priority: task.priority,
                            is_completed: task.is_completed
                        })
                    }
                } else {
                    // Regular 'on' date
                    if (startDate >= start && startDate <= end) {
                        items.push({
                            id: task.id,
                            title: task.title,
                            date: startDate,
                            type: 'task',
                            priority: task.priority,
                            is_completed: task.is_completed
                        })
                    }
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
    }, [todoTasks, reminderTasks, overrides, days, settings.is_demo_mode])

    return {
        schedule,
        loading: todoLoading || reminderLoading || rotaLoading
    }
}
