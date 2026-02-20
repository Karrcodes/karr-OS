'use client'

import { Target, CalendarDays } from 'lucide-react'
import type { Goal } from '../types/finance.types'

interface GoalsListProps {
    goals: Goal[]
}

function ProgressBar({ value, max }: { value: number; max: number }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    return (
        <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
            <div
                className="h-full bg-[#2563eb] rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
            />
        </div>
    )
}

function daysUntil(dateStr: string | null): number | null {
    if (!dateStr) return null
    const diff = new Date(dateStr).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function GoalsList({ goals }: GoalsListProps) {
    if (goals.length === 0) {
        return (
            <div className="rounded-xl border border-black/[0.07] bg-black/[0.02] p-6 text-center">
                <p className="text-black/30 text-sm">No savings goals yet — add one in Settings.</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {goals.map((goal) => {
                const pct = goal.target_amount > 0
                    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                    : 0
                const days = daysUntil(goal.deadline)

                return (
                    <div
                        key={goal.id}
                        className="rounded-xl border border-black/[0.07] bg-white p-4 hover:bg-black/[0.01] transition-colors shadow-sm"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Target className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-black/90">{goal.name}</p>
                                    {days !== null && (
                                        <p className={`text-[10px] flex items-center gap-1 ${days < 30 ? 'text-amber-500' : 'text-black/35'}`}>
                                            <CalendarDays className="w-3 h-3" />
                                            {days > 0 ? `${days} days remaining` : 'Deadline passed'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[14px] font-bold text-black">
                                    £{goal.current_amount.toFixed(2)}
                                </p>
                                <p className="text-[10px] text-black/35">of £{goal.target_amount.toFixed(2)}</p>
                            </div>
                        </div>
                        <ProgressBar value={goal.current_amount} max={goal.target_amount} />
                        <div className="flex justify-between mt-1.5">
                            <span className="text-[10px] text-black/25">{pct.toFixed(0)}% saved</span>
                            <span className="text-[10px] text-black/25">
                                £{Math.max(0, goal.target_amount - goal.current_amount).toFixed(2)} to go
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
