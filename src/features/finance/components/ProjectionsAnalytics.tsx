'use client'

import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, ExternalLink, Briefcase, DollarSign, ChevronLeft, ChevronRight, Info } from 'lucide-react'

// Hardcoded anchor: User states next shift starts on "Monday". 
// Given current date (Feb 20, 2026 - Friday), next Monday is Feb 23, 2026.
const ROTA_ANCHOR_UTC = Date.UTC(2026, 1, 23) // Month is 0-indexed (1 = Feb)

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
    let day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Convert Sunday=0 to Monday=0
}

const HOURS_PER_SHIFT = 11.5
const BASE_RATE = 15.26
const OT_RATE = 20.35
const DEDUCTION_RATE = 0.1877 // ~18.77% deduced from payslip

export function ProjectionsAnalytics() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [dayOverrides, setDayOverrides] = useState<Record<string, 'overtime' | 'absence' | 'holiday'>>({})

    const monthName = currentDate.toLocaleString('default', { month: 'long' })
    const year = currentDate.getFullYear()
    const monthIndex = currentDate.getMonth()

    const { days, paydaysThisMonth, shiftsThisMonth, otThisMonth, absencesThisMonth, holidaysThisMonth, projectedNet } = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, monthIndex)
        const firstDayIdx = getFirstDayOfMonth(year, monthIndex)

        const daysArr = []
        let paydaysCount = 0
        let shiftsCount = 0
        let otCount = 0
        let absencesCount = 0
        let holidaysCount = 0

        // Padding previous month
        for (let i = 0; i < firstDayIdx; i++) {
            daysArr.push(null)
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, monthIndex, day)
            date.setHours(0, 0, 0, 0)

            // Shift Logic: 3-on-3-off relative to Rota Anchor (Strict UTC to prevent timezone drifting)
            const dateUTC = Date.UTC(year, monthIndex, day)
            const diffDays = Math.round((dateUTC - ROTA_ANCHOR_UTC) / 86400000)
            const cycleDay = ((diffDays % 6) + 6) % 6 // Handles negative diffs correctly
            const isShift = cycleDay < 3

            // Payday Logic: Every Friday
            const isPayday = date.getDay() === 5 // 0=Sunday, 5=Friday

            // Overtime & Overrides Logic
            const dateStr = date.toISOString().split('T')[0]
            const override = dayOverrides[dateStr]

            if (override === 'overtime') { otCount++; }
            if (override === 'absence' && isShift) { absencesCount++; }
            if (override === 'holiday' && isShift) { holidaysCount++; }

            if (isShift) shiftsCount++
            if (isPayday) paydaysCount++

            daysArr.push({
                day,
                dateStr,
                date,
                isShift,
                isPayday,
                override,
                isToday: new Date().toDateString() === date.toDateString()
            })
        }

        const effectiveShifts = shiftsCount - absencesCount
        const baseGross = effectiveShifts * HOURS_PER_SHIFT * BASE_RATE
        const otGross = otCount * HOURS_PER_SHIFT * OT_RATE
        const totalGross = baseGross + otGross
        const projectedNet = totalGross * (1 - DEDUCTION_RATE)

        return {
            days: daysArr,
            paydaysThisMonth: paydaysCount,
            shiftsThisMonth: shiftsCount,
            otThisMonth: otCount,
            absencesThisMonth: absencesCount,
            holidaysThisMonth: holidaysCount,
            projectedNet
        }
    }, [year, monthIndex, dayOverrides])

    const nextMonth = () => {
        setCurrentDate(new Date(year, monthIndex + 1, 1))
    }

    const prevMonth = () => {
        setCurrentDate(new Date(year, monthIndex - 1, 1))
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Quick Actions & Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        <p className="text-[11px] text-black/40 mt-1">Calculated 3-on / 3-off schedule.</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 rounded-2xl shadow-sm flex flex-col justify-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-100 uppercase tracking-widest mb-1 relative z-10">
                            Net Income
                        </div>
                        <div className="text-[28px] font-black relative z-10 flex items-baseline gap-1">
                            <span className="text-[18px] opacity-70">£</span>
                            {projectedNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-[11px] text-emerald-100 mt-1 relative z-10">Based on {shiftsThisMonth - absencesThisMonth} worked + {holidaysThisMonth} hol + {otThisMonth} OT. (~18.8% Ded.)</p>
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

                            const { day, isShift, isPayday, isToday, override, dateStr } = d
                            const isOvertime = override === 'overtime'
                            const isAbsence = override === 'absence'
                            const isHoliday = override === 'holiday'

                            const toggleState = () => {
                                setDayOverrides(prev => {
                                    const current = prev[dateStr]
                                    let next: 'overtime' | 'absence' | 'holiday' | undefined

                                    if (isShift) {
                                        if (!current) next = 'absence'
                                        else if (current === 'absence') next = 'holiday'
                                        else next = undefined
                                    } else {
                                        if (!current) next = 'overtime'
                                        else next = undefined
                                    }

                                    const newOverrides = { ...prev }
                                    if (next) newOverrides[dateStr] = next
                                    else delete newOverrides[dateStr]
                                    return newOverrides
                                })
                            }

                            let bgClass = "bg-black/[0.02] border-transparent"
                            let borderClass = ""
                            let textClass = "text-black/60"

                            // Overrides styling takes precedence
                            if (isOvertime) {
                                bgClass = "bg-orange-50 border-orange-200"
                                textClass = "text-orange-900"
                            } else if (isAbsence) {
                                bgClass = "bg-red-50 border-red-200"
                                textClass = "text-red-900"
                            } else if (isHoliday) {
                                bgClass = "bg-purple-50 border-purple-200"
                                textClass = "text-purple-900"
                            } else if (isShift && isPayday) {
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

                            // Keep symbols to a minimum size-wise
                            return (
                                <div
                                    key={i}
                                    onClick={toggleState}
                                    className={`aspect-square cursor-pointer hover:border-black/20 relative rounded-xl border p-1.5 sm:p-2 sm:pt-1.5 transition-all flex flex-col justify-between select-none ${bgClass} ${borderClass}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className={`text-[12px] sm:text-[14px] font-bold ${textClass}`}>{day}</span>
                                            {isOvertime && <span className="text-[8px] sm:text-[9px] bg-orange-500 text-white px-1 py-0.5 rounded font-bold tracking-widest uppercase shadow-sm">OT</span>}
                                            {isAbsence && <span className="text-[8px] sm:text-[9px] bg-red-500 text-white px-1 py-0.5 rounded font-bold tracking-widest uppercase shadow-sm">ABS</span>}
                                            {isHoliday && <span className="text-[8px] sm:text-[9px] bg-purple-500 text-white px-1 py-0.5 rounded font-bold tracking-widest uppercase shadow-sm">HOL</span>}
                                        </div>
                                        {isPayday && <DollarSign className={`w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80 ${isShift && !override ? 'text-emerald-500' : 'text-emerald-700'}`} />}
                                    </div>
                                    <div className="mt-auto flex items-end justify-between">
                                        {(isShift || isOvertime) && !isAbsence && !isHoliday && (
                                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isOvertime ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                        )}
                                        {isPayday && !isShift && !override && (
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
                                        )}
                                    </div>
                                    {isToday && <div className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full border-2 border-white" />}
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-4 text-[11px] text-black/40 font-medium border-t border-black/[0.04] pt-4 select-none">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-[#dbeafe] border border-[#bfdbfe]" /> Shift Day
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-orange-50 border border-orange-200" /> Overtime Shift
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-[#d1fae5] border border-emerald-200" /> Payday OFF
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded border border-emerald-300 bg-[#dbeafe]" /> Payday ON SHIFT
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Absence / Unpaid
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-purple-50 border border-purple-200" /> Paid Holiday
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
