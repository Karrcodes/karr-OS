'use client'

import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, CreditCard, List, LayoutGrid } from 'lucide-react'
import type { RecurringObligation } from '../types/finance.types'

interface ProjectedPayment {
    id: string
    name: string
    amount: number
    date: Date
    group_name: string | null
}

export function CalendarVisualizer({ obligations }: { obligations: RecurringObligation[] }) {
    const [view, setView] = useState<'calendar' | 'list'>('calendar')

    const lenders = useMemo(() => [
        { name: 'Klarna', emoji: '💗', color: '#ffb3c7' },
        { name: 'Clearpay', emoji: '💚', color: '#b2fce1' },
        { name: 'Currys Flexipay', emoji: '💜', color: '#6c3082' },
        { name: 'Other / Subscription', emoji: '💸', color: '#f3f4f6' },
    ], [])

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
                if (obs.frequency === 'weekly') current.setDate(current.getDate() + 7)
                else if (obs.frequency === 'bi-weekly') current.setDate(current.getDate() + 14)
                else if (obs.frequency === 'monthly') current.setMonth(current.getMonth() + 1)
                else if (obs.frequency === 'yearly') current.setFullYear(current.getFullYear() + 1)
            }
        })

        payments.sort((a, b) => a.date.getTime() - b.date.getTime())
        const groupedByDate: { date: Date, total: number, items: ProjectedPayment[] }[] = []
        payments.forEach(p => {
            const dateStr = p.date.toISOString().split('T')[0]
            let existing = groupedByDate.find(g => g.date.toISOString().split('T')[0] === dateStr)
            if (!existing) {
                existing = { date: p.date, total: 0, items: [] }
                groupedByDate.push(existing)
            }
            existing.items.push(p)
            existing.total += p.amount
        })
        return { payments, groupedByDate }
    }, [obligations])

    const groupedByLender = useMemo(() => {
        const groups: Record<string, { o: RecurringObligation[], totalRemaining: number, logo: string }> = {}
        obligations.forEach(obs => {
            const name = obs.name || 'Other'
            if (!groups[name]) {
                groups[name] = {
                    o: [],
                    totalRemaining: 0,
                    logo: lenders.find(l => l.name === name)?.emoji || '💸'
                }
            }
            groups[name].o.push(obs)
            if (obs.payments_left) {
                groups[name].totalRemaining += (obs.amount * obs.payments_left)
            } else if (obs.end_date) {
                const now = new Date()
                const end = new Date(obs.end_date)
                const diffTime = end.getTime() - now.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                let estimatePayments = 0
                if (obs.frequency === 'weekly') estimatePayments = Math.ceil(diffDays / 7)
                else if (obs.frequency === 'bi-weekly') estimatePayments = Math.ceil(diffDays / 14)
                else if (obs.frequency === 'monthly') estimatePayments = Math.ceil(diffDays / 30.44)
                groups[name].totalRemaining += (obs.amount * Math.max(0, estimatePayments))
            }
        })
        return Object.entries(groups).sort((a, b) => b[1].totalRemaining - a[1].totalRemaining)
    }, [obligations, lenders])

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
            <div className="p-4 border-b border-black/[0.06] flex items-center justify-between bg-black/[0.01]">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-[14px] font-bold text-black flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-[#7c3aed]" />
                            Obligation Visualizer
                        </h2>
                        <p className="text-[11px] text-black/40 mt-0.5">{view === 'calendar' ? '30-day projected timeline' : 'Active debts grouped by lender'}</p>
                    </div>
                    <div className="flex p-0.5 bg-black/[0.04] rounded-lg ml-2">
                        <button onClick={() => setView('calendar')} className={`p-1.5 rounded-md transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-[#7c3aed]' : 'text-black/40 hover:text-black/60'}`} title="Calendar View">
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-white shadow-sm text-[#7c3aed]' : 'text-black/40 hover:text-black/60'}`} title="List View">
                            <List className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[16px] font-extrabold text-[#7c3aed]">£{total30Days.toFixed(2)}</div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-black/30">Total 30d</p>
                </div>
            </div>

            <div className="p-5 max-h-[400px] overflow-y-auto">
                {view === 'calendar' ? (
                    <div className="space-y-4">
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
                                                <div className="font-bold text-black/60">£{item.amount.toFixed(2)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groupedByLender.map(([lender, data]) => (
                            <div key={lender} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-black/[0.03] flex items-center justify-center text-lg">{data.logo}</div>
                                        <div>
                                            <h3 className="text-[13px] font-bold text-black/80">{lender}</h3>
                                            <p className="text-[10px] text-black/40 uppercase tracking-tight">{data.o.length} Active Plan{data.o.length > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    {data.totalRemaining > 0 && (
                                        <div className="text-right">
                                            <div className="text-[13px] font-bold text-black/70">£{data.totalRemaining.toFixed(2)}</div>
                                            <p className="text-[9px] text-black/30 uppercase font-bold">Remaining</p>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {data.o.map(obs => (
                                        <div key={obs.id} className="bg-black/[0.02] rounded-xl p-3 border border-black/[0.03] hover:border-black/[0.08] transition-all">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-bold text-[12px] text-black/80">{obs.description || obs.group_name || 'Loan'}</div>
                                                <div className="text-[12px] font-bold text-red-600">£{obs.amount.toFixed(2)} <span className="text-[10px] text-black/20 font-normal">/ {obs.frequency}</span></div>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1 text-[10px] text-black/40 bg-black/[0.04] px-1.5 py-0.5 rounded">
                                                        <CalendarIcon className="w-2.5 h-2.5" />
                                                        Next: {obs.next_due_date}
                                                    </div>
                                                    {obs.payments_left && (
                                                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                                                            {obs.payments_left} left
                                                        </div>
                                                    )}
                                                </div>
                                                {obs.end_date && !obs.payments_left && (
                                                    <div className="text-[10px] text-black/30 italic">Ends {obs.end_date}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
