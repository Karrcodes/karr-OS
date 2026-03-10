'use client'

import React, { useMemo } from 'react'
import { useWellbeing } from '../contexts/WellbeingContext'
import { format, subDays, isSameDay, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export function WorkoutHeatmap() {
    const { workoutLogs } = useWellbeing()

    const days = useMemo(() => {
        return Array.from({ length: 28 }, (_, i) => {
            const date = subDays(new Date(), i)
            const dateStr = format(date, 'yyyy-MM-dd')
            const hasWorkout = workoutLogs.some(log => log.date === dateStr)
            return {
                date: dateStr,
                hasWorkout
            }
        }).reverse()
    }, [workoutLogs])

    const workoutCount = days.filter(d => d.hasWorkout).length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">Consistency</p>
                    <p className="text-[13px] font-black text-black uppercase">{workoutCount} / 28 Days Active</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-black/5" />
                    <div className="w-2 h-2 rounded-full bg-rose-500/20" />
                    <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((day, i) => (
                    <div
                        key={day.date}
                        className={cn(
                            "aspect-square rounded-md border border-black/5 transition-all duration-500",
                            day.hasWorkout
                                ? "bg-rose-500 shadow-lg shadow-rose-500/20 border-rose-600/20 scale-100"
                                : "bg-black/[0.03] scale-95"
                        )}
                        title={day.date}
                    />
                ))}
            </div>

            <div className="flex justify-between text-[8px] font-black text-black/20 uppercase tracking-widest pt-1">
                <span>4 Weeks Ago</span>
                <span>Today</span>
            </div>
        </div>
    )
}
