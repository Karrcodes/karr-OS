'use client'

import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, CreditCard, ChevronLeft, ChevronRight, List, LayoutGrid, Tag } from 'lucide-react'
import type { RecurringObligation } from '../types/finance.types'
import { getLenderLogo, countRemainingPayments } from '../utils/lenderLogos'

interface ProjectedPayment {
    id: string
    name: string
    amount: number
    date: Date
    group_name: string | null
    category: string | null
}


function LenderBadge({ name }: { name: string }) {
    const logoSrc = getLenderLogo(name)
    if (logoSrc) {
        return (
            <div className="w-8 h-8 rounded-xl bg-white border border-black/[0.06] flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                <img src={logoSrc} alt={name} className="w-full h-full object-contain p-0.5" />
            </div>
        )
    }
    return (
        <div className="w-8 h-8 rounded-xl bg-black/[0.06] flex items-center justify-center text-sm font-black text-black/40 flex-shrink-0">
            {name.charAt(0).toUpperCase()}
        </div>
    )
}

type FilterMode = 'all' | 'debt' | 'subscription'

const DEBT_KEYWORDS = ['klarna', 'clearpay', 'currys', 'flexipay', 'loan', 'finance', 'credit']
function isDebt(obs: RecurringObligation) {
    return DEBT_KEYWORDS.some(kw =>
        (obs.name?.toLowerCase() ?? '').includes(kw) ||
        (obs.group_name?.toLowerCase() ?? '').includes(kw) ||
        obs.category === 'debt'
    )
}

export function CalendarVisualizer({ obligations }: { obligations: RecurringObligation[] }) {
    const [view, setView] = useState<'calendar' | 'list'>('calendar')
    const [filter, setFilter] = useState<FilterMode>('all')
    const [calMonth, setCalMonth] = useState(() => {
        const d = new Date()
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        return d
    })

    const filteredObligations = useMemo(() => {
        if (filter === 'all') return obligations
        if (filter === 'debt') return obligations.filter(isDebt)
        return obligations.filter(o => !isDebt(o))
    }, [obligations, filter])

    // Build a full set of projected payments for the displayed month
    const calendarData = useMemo(() => {
        const year = calMonth.getFullYear()
        const month = calMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0, 23, 59, 59)

        // Only show today and future payments — never past dates
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const payments: ProjectedPayment[] = []
        filteredObligations.forEach(obs => {
            let current = new Date(obs.next_due_date)
            current.setHours(0, 0, 0, 0)
            const obsEnd = obs.end_date ? new Date(obs.end_date) : null
            if (obsEnd) obsEnd.setHours(23, 59, 59, 999)

            let occurrences = 0
            const hasLimit = obs.payments_left != null && obs.payments_left > 0
            const maxOccurrences = hasLimit ? obs.payments_left : Infinity

            // Strictly wind forward from next_due_date
            while (current <= lastDay) {
                if (hasLimit && occurrences >= maxOccurrences!) break
                if (obsEnd && current > obsEnd) break

                // If this occurrence lands in the viewed month AND is >= today, collect it
                if (current >= firstDay && current >= today) {
                    payments.push({
                        id: `${obs.id}-${current.getTime()}`,
                        name: obs.name,
                        amount: obs.amount,
                        date: new Date(current),
                        group_name: obs.group_name,
                        category: obs.category
                    })
                }

                occurrences++

                // Advance to next payment date
                if (obs.frequency === 'weekly') current.setDate(current.getDate() + 7)
                else if (obs.frequency === 'bi-weekly') current.setDate(current.getDate() + 14)
                else if (obs.frequency === 'monthly') current.setMonth(current.getMonth() + 1)
                else if (obs.frequency === 'yearly') current.setFullYear(current.getFullYear() + 1)
                else break
            }
        })

        // Map day number → payments
        const byDay: Record<number, ProjectedPayment[]> = {}
        payments.forEach(p => {
            const d = p.date.getDate()
            if (!byDay[d]) byDay[d] = []
            byDay[d].push(p)
        })

        const totalMonth = payments.reduce((s, p) => s + p.amount, 0)
        return { byDay, totalMonth, daysInMonth: lastDay.getDate(), startDow: firstDay.getDay() }
    }, [calMonth, filteredObligations])

    // 30-day projection for list view header
    const total30Days = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const end = new Date(today)
        end.setDate(today.getDate() + 30)

        let total = 0
        filteredObligations.forEach(obs => {
            let current = new Date(obs.next_due_date)
            current.setHours(0, 0, 0, 0)
            const obsEnd = obs.end_date ? new Date(obs.end_date) : null
            if (obsEnd) obsEnd.setHours(23, 59, 59, 999)

            let occurrences = 0
            const hasLimit = obs.payments_left != null && obs.payments_left > 0
            const maxOccurrences = hasLimit ? obs.payments_left : Infinity

            while (current <= end) {
                if (hasLimit && occurrences >= maxOccurrences!) break
                if (obsEnd && current > obsEnd) break

                if (current >= today) total += obs.amount

                occurrences++
                if (obs.frequency === 'weekly') current.setDate(current.getDate() + 7)
                else if (obs.frequency === 'bi-weekly') current.setDate(current.getDate() + 14)
                else if (obs.frequency === 'monthly') current.setMonth(current.getMonth() + 1)
                else if (obs.frequency === 'yearly') current.setFullYear(current.getFullYear() + 1)
                else break
            }
        })
        return total
    }, [filteredObligations])

    // For list view: group by lender
    const groupedByLender = useMemo(() => {
        const groups: Record<string, { o: RecurringObligation[]; totalRemaining: number }> = {}
        const now = new Date()

        filteredObligations.forEach(obs => {
            const name = obs.name || 'Other'
            if (!groups[name]) groups[name] = { o: [], totalRemaining: 0 }
            groups[name].o.push(obs)

            if (obs.end_date || obs.payments_left) {
                // Use explicitly stored payments_left if set; otherwise derive from dates
                const paymentsLeft = countRemainingPayments(obs.next_due_date, obs.end_date, obs.frequency, now, obs.payments_left)
                groups[name].totalRemaining += obs.amount * paymentsLeft
            }
        })
        return Object.entries(groups).sort((a, b) => b[1].totalRemaining - a[1].totalRemaining)
    }, [filteredObligations])

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

    const today = new Date()
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-black/[0.06] flex items-center justify-between bg-black/[0.01] gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <h2 className="text-[14px] font-bold text-black flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#7c3aed]" />
                        {view === 'calendar' ? 'Payment Calendar' : 'Obligation Breakdown'}
                    </h2>
                    {/* Filter pills */}
                    <div className="flex p-0.5 bg-black/[0.04] rounded-lg ml-1">
                        {(['all', 'debt', 'subscription'] as FilterMode[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-white shadow-sm text-[#7c3aed]' : 'text-black/40 hover:text-black/60'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    {/* View toggle */}
                    <div className="flex p-0.5 bg-black/[0.04] rounded-lg">
                        <button onClick={() => setView('calendar')} className={`p-1.5 rounded-md transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-[#7c3aed]' : 'text-black/40 hover:text-black/60'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-white shadow-sm text-[#7c3aed]' : 'text-black/40 hover:text-black/60'}`}><List className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="text-right">
                        <div className="text-[16px] font-extrabold text-[#7c3aed]">
                            £{view === 'calendar' ? calendarData.totalMonth.toFixed(2) : total30Days.toFixed(2)}
                        </div>
                        <p className="text-[9px] uppercase tracking-wider font-bold text-black/30">{view === 'calendar' ? 'This Month' : 'Next 30d'}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 max-h-[520px] overflow-y-auto">
                {view === 'calendar' ? (
                    <div>
                        {/* Month navigation */}
                        <div className="flex items-center justify-between mb-3">
                            <button
                                onClick={() => setCalMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() - 1); return n })}
                                className="p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-black/40" />
                            </button>
                            <span className="text-[13px] font-bold text-black">
                                {calMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                            </span>
                            <button
                                onClick={() => setCalMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() + 1); return n })}
                                className="p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-black/40" />
                            </button>
                        </div>

                        {/* Day-of-week headers */}
                        <div className="grid grid-cols-7 mb-1">
                            {DAY_LABELS.map(d => (
                                <div key={d} className="text-center text-[9px] font-bold text-black/25 uppercase tracking-wider py-1">{d}</div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-px bg-black/[0.04] rounded-xl overflow-hidden border border-black/[0.04]">
                            {/* Leading empty cells */}
                            {Array.from({ length: calendarData.startDow }).map((_, i) => (
                                <div key={`empty-${i}`} className="bg-white/60 min-h-[52px]" />
                            ))}
                            {/* Day cells */}
                            {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                                const day = i + 1
                                const payments = calendarData.byDay[day] || []
                                const isToday = today.getDate() === day &&
                                    today.getMonth() === calMonth.getMonth() &&
                                    today.getFullYear() === calMonth.getFullYear()
                                const hasPay = payments.length > 0
                                const dayTotal = payments.reduce((s, p) => s + p.amount, 0)
                                const isPast = new Date(calMonth.getFullYear(), calMonth.getMonth(), day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

                                return (
                                    <div
                                        key={day}
                                        className={`bg-white min-h-[52px] p-1.5 flex flex-col gap-1 transition-colors
                                            ${isToday ? 'bg-[#7c3aed]/[0.04]' : ''}
                                            ${isPast && !isToday ? 'opacity-40' : ''}
                                        `}
                                    >
                                        <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full
                                            ${isToday ? 'bg-[#7c3aed] text-white' : 'text-black/40'}
                                        `}>
                                            {day}
                                        </span>
                                        {hasPay && (
                                            <>
                                                {payments.slice(0, 2).map((p, pi) => (
                                                    <div key={pi} title={`${p.name}: £${p.amount.toFixed(2)}`} className="bg-red-50 border border-red-100 rounded px-1 py-0.5 truncate">
                                                        <span className="text-[8px] font-bold text-red-600 truncate block">{p.name}</span>
                                                    </div>
                                                ))}
                                                {payments.length > 2 && (
                                                    <span className="text-[8px] text-black/30 font-bold">+{payments.length - 2} more</span>
                                                )}
                                                <span className="text-[8px] font-bold text-red-500 mt-auto">-£{dayTotal.toFixed(0)}</span>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groupedByLender.length === 0 && (
                            <p className="text-[12px] text-black/30 text-center py-8">No obligations in this category.</p>
                        )}
                        {groupedByLender.map(([lender, data]) => (
                            <div key={lender} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <LenderBadge name={lender} />
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
                                                <div className="flex items-center gap-1 text-[10px] text-black/40 bg-black/[0.04] px-1.5 py-0.5 rounded">
                                                    <CalendarIcon className="w-2.5 h-2.5" />
                                                    Next: {obs.next_due_date}
                                                </div>
                                                {obs.end_date && (
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
