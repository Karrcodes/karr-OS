'use client'

import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, ExternalLink, Briefcase, DollarSign, ChevronLeft, ChevronRight, Info, Check, X } from 'lucide-react'

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

    const [bookingOpen, setBookingOpen] = useState(false)
    const [bookDays, setBookDays] = useState('')
    const [bookFirst, setBookFirst] = useState('')
    const [bookLast, setBookLast] = useState('')
    const [bookReturn, setBookReturn] = useState('')
    const [bookReason, setBookReason] = useState('Annual Leave')

    const activeOverrides = useMemo(() => {
        const abs = Object.keys(dayOverrides).filter(k => dayOverrides[k] === 'absence').sort()
        const hol = Object.keys(dayOverrides).filter(k => dayOverrides[k] === 'holiday').sort()
        const ot = Object.keys(dayOverrides).filter(k => dayOverrides[k] === 'overtime').sort()
        return { abs, hol, ot }
    }, [dayOverrides])

    const handleOpenBooking = () => {
        const { hol } = activeOverrides
        setBookDays(hol.length.toString())
        if (hol.length > 0) {
            setBookFirst(hol[0])
            setBookLast(hol[hol.length - 1])
            const retDate = new Date(hol[hol.length - 1])
            retDate.setDate(retDate.getDate() + 1)
            setBookReturn(retDate.toISOString().split('T')[0])
        }
        setBookingOpen(true)
    }

    const submitBooking = () => {
        const formId = "j_NRZWJQb0-a7XxZvz4tGEMcjSxEbT1OkE4gUvilROBUNzdGTFlCWkFPTjk5RlhWNFdNNk4xREtQSy4u"
        const baseUrl = `https://forms.office.com/Pages/ResponsePage.aspx?id=${formId}`

        const params = new URLSearchParams()
        params.append('r38f9b0a08112418f999c9be4b039ea12', "3711148963") // Badge
        params.append('r9e5f1108f508457b860ff4a5009cb316', "Umaru AbdulAlim") // Name
        params.append('r2e22e78b63e04d97afef3084d56f2048', "HLOP") // Dept
        params.append('rb4fd0ddc565c4eda8d049f0ea1df8a19', "12 hour (0600-1800)") // Shift
        params.append('rabbc8d260b7647f49e584cf4ae6791ae', new Date().toISOString().split('T')[0]) // Today

        if (bookFirst) params.append('r174c10835f374d6a8cc50adb883619ad', bookFirst)
        if (bookLast) params.append('r796739c016a84af18c0c1aaa47db48f6', bookLast)
        if (bookReturn) params.append('r776081eb9aeb440ba39a517960c00407', bookReturn)
        if (bookDays) params.append('r77734ecce2d242f68ce5b9b4ef034430', bookDays)
        if (bookReason) params.append('rbbc3b3b348b04bb998be461b02a2e307', bookReason)

        window.open(`${baseUrl}&${params.toString()}`, '_blank')
        setBookingOpen(false)
    }

    const monthName = currentDate.toLocaleString('default', { month: 'long' })
    const year = currentDate.getFullYear()
    const monthIndex = currentDate.getMonth()

    const { days, paydaysThisMonth, shiftsThisMonth, otThisMonth, absencesThisMonth, holidaysThisMonth, projectedNet, weeklyPayMap } = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, monthIndex)
        const firstDayIdx = getFirstDayOfMonth(year, monthIndex)

        // For arrears logic, we need to calculate earnings for some days BEFORE the current month 
        // to determine the pay for the first Friday(s) of this month.
        // Let's calculate for a range of -14 to +31 days from start of month.
        const monthStart = new Date(year, monthIndex, 1)
        const calculationStart = new Date(monthStart)
        calculationStart.setDate(calculationStart.getDate() - 14) // 2 weeks padding

        const calculationEnd = new Date(year, monthIndex, daysInMonth + 7) // 1 week padding

        const weeklyPayMap: Record<string, number> = {}
        const dailyEarnings: Record<string, number> = {}

        // 1. Calculate daily earnings for the relevant range
        let curr = new Date(calculationStart)
        while (curr <= calculationEnd) {
            const dateUTC = Date.UTC(curr.getFullYear(), curr.getMonth(), curr.getDate())
            const diffDays = Math.round((dateUTC - ROTA_ANCHOR_UTC) / 86400000)
            const cycleDay = ((diffDays % 6) + 6) % 6
            const isShift = cycleDay < 3

            const dateStr = curr.toISOString().split('T')[0]
            const override = dayOverrides[dateStr]

            let isWorked = isShift && override !== 'absence'
            let isOT = override === 'overtime'
            let isHol = isShift && override === 'holiday'

            let gross = 0
            if (isWorked || isHol) gross += HOURS_PER_SHIFT * BASE_RATE
            if (isOT) gross += HOURS_PER_SHIFT * OT_RATE

            dailyEarnings[dateStr] = gross * (1 - DEDUCTION_RATE)

            // 2. Determine which Payday (Friday) this day belongs to
            // Accounting week: Sun -> Sat. Payday: Following Fri.
            const dayOfWeek = curr.getDay() // 0=Sun, 6=Sat
            const daysUntilSaturday = 6 - dayOfWeek

            const accountingSat = new Date(curr)
            accountingSat.setDate(curr.getDate() + daysUntilSaturday)

            const paydayFri = new Date(accountingSat)
            paydayFri.setDate(accountingSat.getDate() + 6) // Sat + 6 days = Next Fri

            const paydayStr = paydayFri.toISOString().split('T')[0]
            weeklyPayMap[paydayStr] = (weeklyPayMap[paydayStr] || 0) + dailyEarnings[dateStr]

            curr.setDate(curr.getDate() + 1)
        }

        const daysArr = []
        let paydaysCount = 0
        let shiftsCount = 0
        let otCount = 0
        let absencesCount = 0
        let holidaysCount = 0
        let totalMonthNet = 0

        // Padding previous month
        for (let i = 0; i < firstDayIdx; i++) {
            daysArr.push(null)
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, monthIndex, day)
            date.setHours(0, 0, 0, 0)
            const dateStr = date.toISOString().split('T')[0]

            const dateUTC = Date.UTC(year, monthIndex, day)
            const diffDays = Math.round((dateUTC - ROTA_ANCHOR_UTC) / 86400000)
            const cycleDay = ((diffDays % 6) + 6) % 6
            const isShift = cycleDay < 3

            const isPayday = date.getDay() === 5
            const override = dayOverrides[dateStr]

            if (override === 'overtime') { otCount++; }
            if (override === 'absence' && isShift) { absencesCount++; }
            if (override === 'holiday' && isShift) { holidaysCount++; }
            if (isShift) shiftsCount++
            if (isPayday) {
                paydaysCount++
                totalMonthNet += weeklyPayMap[dateStr] || 0
            }

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

        return {
            days: daysArr,
            paydaysThisMonth: paydaysCount,
            shiftsThisMonth: shiftsCount,
            otThisMonth: otCount,
            absencesThisMonth: absencesCount,
            holidaysThisMonth: holidaysCount,
            projectedNet: totalMonthNet,
            weeklyPayMap
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
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
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
                                        {isPayday && (
                                            <div className={`flex items-center gap-0.5 font-bold text-[10px] sm:text-[11px] opacity-90 ${isShift && !override ? 'text-emerald-600' : 'text-emerald-700'}`}>
                                                <span>£{(weeklyPayMap[dateStr] || 0).toFixed(0)}</span>
                                            </div>
                                        )}
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

                    {(activeOverrides.abs.length > 0 || activeOverrides.hol.length > 0 || activeOverrides.ot.length > 0) && (
                        <div className="mt-5 p-4 rounded-xl border border-black/[0.08] bg-black/[0.02] flex items-center justify-between">
                            <div className="text-[13px] font-semibold text-black/70 flex flex-wrap gap-2 items-center">
                                Unsaved Overrides
                                <div className="flex gap-1">
                                    {activeOverrides.abs.length > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-[10px] uppercase font-bold text-red-700">{activeOverrides.abs.length} ABS</span>}
                                    {activeOverrides.hol.length > 0 && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[10px] uppercase font-bold text-purple-700">{activeOverrides.hol.length} HOL</span>}
                                    {activeOverrides.ot.length > 0 && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[10px] uppercase font-bold text-orange-700">{activeOverrides.ot.length} OT</span>}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 block sm:hidden md:flex">
                                {activeOverrides.abs.length > 0 && (
                                    <button
                                        onClick={() => {
                                            alert("Absence logged locally for Projections.")
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[12px] font-bold hover:bg-red-100 transition-colors"
                                    >
                                        Confirm Absence
                                    </button>
                                )}
                                {activeOverrides.hol.length > 0 && (
                                    <button
                                        onClick={handleOpenBooking}
                                        className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-[12px] font-bold hover:bg-purple-100 transition-colors"
                                    >
                                        Book Holiday
                                    </button>
                                )}
                                {activeOverrides.ot.length > 0 && (
                                    <button
                                        onClick={() => {
                                            alert("Overtime logged locally for Projections.")
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 text-[12px] font-bold hover:bg-orange-100 transition-colors"
                                    >
                                        Confirm Overtime
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

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

            {/* Holiday Booking Modal */}
            {bookingOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBookingOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
                        <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between bg-black/[0.02]">
                            <h3 className="text-[16px] font-bold text-black flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-lg">✈️</span>
                                Holiday Request
                            </h3>
                            <button onClick={() => setBookingOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-black/40 hover:bg-black/5 hover:text-black transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-[13px] text-black/60 leading-relaxed">
                                Complete these details to generate your pre-filled Microsoft Forms request. Your Badge ID and personal details will be automatically attached.
                            </p>

                            <div className="space-y-4 pt-2">
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex-1 min-w-[130px]">
                                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-1.5 block">First Date</label>
                                        <input type="date" value={bookFirst} onChange={e => setBookFirst(e.target.value)} className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-purple-500" />
                                    </div>
                                    <div className="flex-1 min-w-[130px]">
                                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-1.5 block">Last Date</label>
                                        <input type="date" value={bookLast} onChange={e => setBookLast(e.target.value)} className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-purple-500" />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <div className="flex-1 min-w-[130px]">
                                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-1.5 block">Total Days</label>
                                        <input type="number" value={bookDays} onChange={e => {
                                            const newDays = e.target.value
                                            setBookDays(newDays)
                                            const parsedDays = parseInt(newDays, 10)
                                            if (!isNaN(parsedDays) && parsedDays > 0 && bookFirst) {
                                                const first = new Date(bookFirst)

                                                const last = new Date(first)
                                                last.setDate(first.getDate() + (parsedDays - 1))
                                                setBookLast(last.toISOString().split('T')[0])

                                                const ret = new Date(last)
                                                ret.setDate(last.getDate() + 1)
                                                setBookReturn(ret.toISOString().split('T')[0])
                                            }
                                        }} className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-purple-500" />
                                    </div>
                                    <div className="flex-1 min-w-[130px]">
                                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-1.5 block">Return Date</label>
                                        <input type="date" value={bookReturn} onChange={e => setBookReturn(e.target.value)} className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-purple-500" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-1.5 block">Reason for Leave</label>
                                    <input type="text" value={bookReason} onChange={e => setBookReason(e.target.value)} className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-purple-500" />
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-black/[0.06] bg-black/[0.01]">
                            <button onClick={submitBooking} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-[14px] hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200">
                                Open Microsoft Form <ExternalLink className="w-4 h-4 opacity-70" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
