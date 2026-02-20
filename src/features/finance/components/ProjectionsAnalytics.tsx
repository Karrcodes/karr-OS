'use client'

import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, ExternalLink, Briefcase, DollarSign, ChevronLeft, ChevronRight, Info } from 'lucide-react'

// Hardcoded anchor: User states next shift starts on "Monday". 
// Given current date (Feb 20, 2026 - Friday), next Monday is Feb 23, 2026.
const ROTA_ANCHOR = new Date(2026, 1, 23) // Month is 0-indexed (1 = Feb)

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
    let day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Convert Sunday=0 to Monday=0
}

export function ProjectionsAnalytics() {
    const [currentDate, setCurrentDate] = useState(new Date())

    const monthName = currentDate.toLocaleString('default', { month: 'long' })
    const year = currentDate.getFullYear()
    const monthIndex = currentDate.getMonth()

    const { days, paydaysThisMonth, shiftsThisMonth } = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, monthIndex)
        const firstDayIdx = getFirstDayOfMonth(year, monthIndex)

        const daysArr = []
        let paydaysCount = 0
        let shiftsCount = 0

        // Padding previous month
        for (let i = 0; i < firstDayIdx; i++) {
            daysArr.push(null)
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, monthIndex, day)
            date.setHours(0, 0, 0, 0)

            // Shift Logic: 3-on-3-off relative to Rota Anchor
            const diffTime = date.getTime() - ROTA_ANCHOR.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            const cycleDay = ((diffDays % 6) + 6) % 6 // Handles negative diffs correctly
            const isShift = cycleDay < 3

            // Payday Logic: Every Friday
            const isPayday = date.getDay() === 5 // 0=Sunday, 5=Friday

            if (isShift) shiftsCount++
            if (isPayday) paydaysCount++

            daysArr.push({
                day,
                date,
                isShift,
                isPayday,
                isToday: new Date().toDateString() === date.toDateString()
            })
        }

        return { days: daysArr, paydaysThisMonth: paydaysCount, shiftsThisMonth: shiftsCount }
    }, [year, monthIndex])

    const nextMonth = () => {
        setCurrentDate(new Date(year, monthIndex + 1, 1))
    }

    const prevMonth = () => {
        setCurrentDate(new Date(year, monthIndex - 1, 1))
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Quick Actions & Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                    href="https://universe.staffline.co.uk/"
                    target="_blank"
                    rel="noreferrer"
                    className="md:col-span-1 bg-gradient-to-br from-[#1d4ed8] to-[#1e3a8a] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/20 transition-all duration-500"></div>
                    <div className="flex items-center justify-between z-10">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <ExternalLink className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                    </div>
                    <div className="mt-6 z-10">
                        <h3 className="text-[16px] font-bold text-white">Staffline Universe</h3>
                        <p className="text-[12px] text-blue-200 mt-1">Access your official payslips and portal</p>
                    </div>
                </a>

                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-black/40 uppercase tracking-widest mb-1">
                            <DollarSign className="w-4 h-4 text-emerald-500" /> Pay Cycle
                        </div>
                        <div className="text-[28px] font-black text-black">
                            {paydaysThisMonth} <span className="text-[14px] text-black/40 font-semibold ml-1">Fridays</span>
                        </div>
                        <p className="text-[11px] text-black/40 mt-1">You will be paid {paydaysThisMonth} times in {monthName}.</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-black/40 uppercase tracking-widest mb-1">
                            <CalendarIcon className="w-4 h-4 text-blue-500" /> Rota Projection
                        </div>
                        <div className="text-[28px] font-black text-black">
                            {shiftsThisMonth} <span className="text-[14px] text-black/40 font-semibold ml-1">Shifts</span>
                        </div>
                        <p className="text-[11px] text-black/40 mt-1">Based on 3-on / 3-off schedule.</p>
                    </div>
                </div>
            </div>

            {/* Rota Calendar */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-black/[0.04] flex items-center justify-between bg-black/[0.01]">
                    <div>
                        <h2 className="text-[16px] font-bold text-black flex items-center gap-2">
                            Rota & Pay Calendar
                            <span className="text-[10px] bg-black/5 text-black/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{monthName} {year}</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 text-black/40 hover:text-black transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="text-[11px] font-bold text-black/40 hover:text-black px-2 transition-colors uppercase tracking-wider">
                            Today
                        </button>
                        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 text-black/40 hover:text-black transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-5">
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="text-center text-[10px] font-bold uppercase tracking-wider text-black/30 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {days.map((d, i) => {
                            if (!d) return <div key={i} className="aspect-square bg-transparent rounded-xl" />

                            const { day, isShift, isPayday, isToday } = d

                            let bgClass = "bg-black/[0.02] border-transparent"
                            let borderClass = ""
                            let textClass = "text-black/60"

                            if (isShift && isPayday) {
                                bgClass = "bg-[#dbeafe]" // Blueish
                                borderClass = "border-emerald-300" // Green border
                                textClass = "text-blue-900"
                            } else if (isShift) {
                                bgClass = "bg-[#dbeafe]" // Solid blue
                                textClass = "text-blue-900"
                            } else if (isPayday) {
                                bgClass = "bg-[#d1fae5]" // Solid green
                                textClass = "text-emerald-900"
                            }

                            if (isToday) {
                                borderClass = "border-black shadow-sm"
                            }

                            return (
                                <div key={i} className={`aspect-square relative rounded-xl border p-1.5 sm:p-2 sm:pt-1.5 transition-all flex flex-col justify-between ${bgClass} ${borderClass}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`text-[12px] sm:text-[14px] font-bold ${textClass}`}>{day}</span>
                                        {isPayday && <DollarSign className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isShift ? 'text-emerald-500' : 'text-emerald-600'}`} />}
                                    </div>
                                    <div className="mt-auto flex items-end justify-between">
                                        {isShift && (
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
                                        )}
                                        {isPayday && !isShift && (
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
                                        )}
                                    </div>
                                    {isToday && <div className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full border-2 border-white" />}
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-4 text-[11px] text-black/40 font-medium border-t border-black/[0.04] pt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-[#dbeafe]" /> Shift Day
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-[#d1fae5]" /> Payday OFF
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded border border-emerald-300 bg-[#dbeafe]" /> Payday ON SHIFT
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
