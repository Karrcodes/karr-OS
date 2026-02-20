'use client'

import { useMemo } from 'react'
import { Calendar as CalendarIcon, CreditCard } from 'lucide-react'
import type { RecurringObligation } from '../types/finance.types'

interface ProjectedPayment {
    id: string
    name: string
    amount: number
    date: Date
    group_name: string | null
}

export function CalendarVisualizer({ obligations }: { obligations: RecurringObligation[] }) {
    const projections = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const thirtyDaysFromNow = new Date(today)
        thirtyDaysFromNow.setDate(today.getDate() + 30)

        const payments: ProjectedPayment[] = []

        obligations.forEach(obs => {
            let current = new Date(obs.next_due_date)
            current.setHours(0, 0, 0, 0)

            const end = obs.end_date ? new Date(obs.end_date) : thirtyDaysFromNow
            end.setHours(23, 59, 59, 999)

            // Loop to project dates
            while (current <= thirtyDaysFromNow && current <= end) {
                if (current >= today) {
                    payments.push({
                        id: `${obs.id}-${current.getTime()}`,
                        name: obs.name,
                        amount: obs.amount,
                        date: new Date(current),
                        group_name: obs.group_name
                    })
                }

                // Increment date based on frequency
                if (obs.frequency === 'weekly') {
                    current.setDate(current.getDate() + 7)
                } else if (obs.frequency === 'bi-weekly') {
                    current.setDate(current.getDate() + 14)
                } else if (obs.frequency === 'monthly') {
                    current.setMonth(current.getMonth() + 1)
                } else if (obs.frequency === 'yearly') {
                    current.setFullYear(current.getFullYear() + 1)
                }
            }
        })

        payments.sort((a, b) => a.date.getTime() - b.date.getTime())

        // Group by date to visualize days with multiple payments better
        const groupedByDate: { date: Date, total: number, items: ProjectedPayment[] }[] = []

        payments.forEach(p => {
            const dateStr = p.date.toISOString().split('T')[0]
            let existing = groupedByDate.find(g => g.date.toISOString().split('T')[0] === dateStr)
            if (!existing) {
                existing = { date: p.date, total: 0, items: [] }
                groupedByDate.push(existing)
            }
            // Add item
            existing.items.push(p)
            existing.total += p.amount
        })

        return { payments, groupedByDate }
    }, [obligations])

    const total30Days = projections.payments.reduce((s, p) => s + p.amount, 0)

    if (obligations.length === 0) {
        return (
            <div className="rounded-2xl border border-black/[0.08] bg-white p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-black/[0.03] flex items-center justify-center mb-3">
                    <CalendarIcon className="w-5 h-5 text-black/30" />
                </div>
                <h3 className="text-[14px] font-bold text-black/80">No Upcoming Payments</h3>
                <p className="text-[12px] text-black/40 mt-1">Add subscriptions, rent, or debts in settings.</p>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-sm">
            <div className="p-5 border-b border-black/[0.06] flex items-center justify-between bg-black/[0.01]">
                <div>
                    <h2 className="text-[14px] font-bold text-black flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#7c3aed]" />
                        30-Day Outlook
                    </h2>
                    <p className="text-[11px] text-black/40 mt-0.5">Upcoming scheduled payments</p>
                </div>
                <div className="text-right">
                    <div className="text-[18px] font-extrabold text-[#7c3aed]">
                        £{total30Days.toFixed(2)}
                    </div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-black/30">Total 30d</p>
                </div>
            </div>

            <div className="p-5 max-h-[360px] overflow-y-auto space-y-4">
                {projections.groupedByDate.map((group, idx) => {
                    const isToday = new Date().toISOString().split('T')[0] === group.date.toISOString().split('T')[0]
                    const daysAway = Math.ceil((group.date.getTime() - new Date().getTime()) / (1000 * 3600 * 24))

                    return (
                        <div key={idx} className="relative">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? 'text-[#059669]' : 'text-black/40'}`}>
                                    {isToday ? 'Today' : group.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                                {!isToday && daysAway > 0 && <span className="text-[10px] text-black/25">In {daysAway} day{daysAway > 1 && 's'}</span>}
                                <div className="flex-1 h-px bg-black/[0.04]" />
                                <span className="text-[12px] font-bold text-black/30">£{group.total.toFixed(2)}</span>
                            </div>

                            <div className="space-y-1.5 pl-2 border-l-2 border-black/[0.04] ml-1">
                                {group.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between text-[13px] bg-black/[0.02] hover:bg-black/[0.04] p-2 rounded-lg transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            <CreditCard className="w-3.5 h-3.5 text-black/30" />
                                            <div>
                                                <div className="font-semibold text-black/80">{item.name}</div>
                                                {item.group_name && <div className="text-[10px] text-black/40">{item.group_name}</div>}
                                            </div>
                                        </div>
                                        <div className="font-bold text-black/60">
                                            £{item.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
