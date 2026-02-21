'use client'

import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, ExternalLink, Briefcase, DollarSign, ChevronLeft, ChevronRight, Info, Check, X, Trash2 } from 'lucide-react'
import { useRota } from '../hooks/useRota'

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

    // Persistent overrides from DB
    const { overrides: bookedOverrides, saveOverrides, deleteOverrideByDate } = useRota()

    const [bookingOpen, setBookingOpen] = useState(false)
    const [bookDays, setBookDays] = useState('')
    const [bookFirst, setBookFirst] = useState('')
    const [bookLast, setBookLast] = useState('')
    const [bookReturn, setBookReturn] = useState('')
    const [bookReason, setBookReason] = useState('Annual Leave')

    // Cancellation Confirmation State
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
    const [itemToCancel, setItemToCancel] = useState<{ date: string, type: string } | null>(null)

    // Merged overrides for calculation
    const allOverrides = useMemo(() => {
        const result: Record<string, 'overtime' | 'absence' | 'holiday'> = {}
        // Booked (DB) takes base precedence
        bookedOverrides.forEach(o => {
            result[o.date] = o.type
        })
        // Staged (Local) overrides booked locally for visual feedback if needed, 
        // but here we probably want them to be distinct.
        Object.entries(dayOverrides).forEach(([date, type]) => {
            result[date] = type
        })
        return result
    }, [bookedOverrides, dayOverrides])

    const activeStaged = useMemo(() => {
        const abs = Object.keys(dayOverrides).filter(k => dayOverrides[k] === 'absence').sort()
        const hol = Object.keys(dayOverrides).filter(k => dayOverrides[k] === 'holiday').sort()
        const ot = Object.keys(dayOverrides).filter(k => dayOverrides[k] === 'overtime').sort()
        return { abs, hol, ot }
    }, [dayOverrides])

    const handleOpenBooking = () => {
        const { hol } = activeStaged
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

    const handleConfirmStaged = async (type: 'overtime' | 'absence') => {
        const dates = Object.keys(dayOverrides).filter(k => dayOverrides[k] === type)
        try {
            await saveOverrides(dates.map(date => ({ date, type })))
            setDayOverrides(prev => {
                const next = { ...prev }
                dates.forEach(d => delete next[d])
                return next
            })
        } catch (err) {
            console.error(err)
            alert("Failed to confirm overrides.")
        }
    }

    const submitBooking = async () => {
        const formId = "j_NRZWJQb0-a7XxZvz4tGEMcjSxEbT1OkE4gUvilROBUNzdGTFlCWkFPTjk5RlhWNFdNNk4xREtQSy4u"

        const IDs = {
            today: "rabbc8d260b7647f49e584cf4ae6791ae",
            badge: "r38f9b0a08112418f999c9be4b039ea12",
            name: "r9e5f1108f508457b860ff4a5009cb316",
            dept: "r2e22e78b63e04d97afef3084d56f2048",
            shift: "rb4fd0ddc565c4eda8d049f0ea1df8a19",
            days: "r77734ecce2d242f68ce5b9b4ef034430",
            first: "r174c10835f374d6a8cc50adb883619ad",
            last: "r796739c016a84af18c0c1aaa47db48f6",
            return: "r776081eb9aeb440ba39a517960c00407",
            reason: "rbbc3b3b348b04bb998be461b02a2e307"
        }

        const todayStr = new Date().toISOString().split('T')[0]
        const firstStr = bookFirst ? new Date(bookFirst).toISOString().split('T')[0] : ''
        const lastStr = bookLast ? new Date(bookLast).toISOString().split('T')[0] : ''
        const returnStr = bookReturn ? new Date(bookReturn).toISOString().split('T')[0] : ''

        const params = new URLSearchParams()
        params.append(IDs.today, todayStr)
        params.append(IDs.badge, "3711148963")
        params.append(IDs.name, "Umaru AbdulAlim")
        params.append(IDs.dept, "HLOP")
        params.append(IDs.shift, "12 hour (0600-1800)")
        params.append(IDs.days, bookDays)
        params.append(IDs.first, firstStr)
        params.append(IDs.last, lastStr)
        params.append(IDs.return, returnStr)
        params.append(IDs.reason, bookReason)

        const baseUrl = `https://forms.office.com/Pages/ResponsePage.aspx?id=${formId}&${params.toString()}`

        // Save Holidays to DB before redirecting
        const holDates = Object.keys(dayOverrides).filter(k => dayOverrides[k] === 'holiday')
        try {
            await saveOverrides(holDates.map(date => ({ date, type: 'holiday' as const })))
            setDayOverrides(prev => {
                const next = { ...prev }
                holDates.forEach(d => delete next[d])
                return next
            })

            const clipboardText = `Badge: 3711148963
Name: Umaru AbdulAlim
Dept: HLOP
Shift: 12 hour (0600-1800)
Today's Date: ${new Date().toLocaleDateString()}
First Date of Holiday: ${bookFirst ? new Date(bookFirst).toLocaleDateString() : ''}
Last Date of Holiday: ${bookLast ? new Date(bookLast).toLocaleDateString() : ''}
Total Days: ${bookDays}
Return Date: ${bookReturn ? new Date(bookReturn).toLocaleDateString() : ''}
Reason: ${bookReason}`

            navigator.clipboard.writeText(clipboardText).then(() => {
                alert("Success! Holidays have been booked on your rota.\n\nWe are now attempting to pre-fill the form for you. Backup details are on your clipboard.")
                window.open(baseUrl, '_blank')
                setBookingOpen(false)
            }).catch(() => {
                window.open(baseUrl, '_blank')
                setBookingOpen(false)
            })
        } catch (err) {
            console.error(err)
            alert("Failed to save holiday booking to rota.")
        }
    }

    const monthName = currentDate.toLocaleString('default', { month: 'long' })
    const year = currentDate.getFullYear()
    const monthIndex = currentDate.getMonth()

    const { days, paydaysThisMonth, shiftsThisMonth, otThisMonth, absencesThisMonth, holidaysThisMonth, projectedNet, weeklyPayMap } = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, monthIndex)
        const firstDayIdx = getFirstDayOfMonth(year, monthIndex)

        const monthStart = new Date(year, monthIndex, 1)
        const calculationStart = new Date(monthStart)
        calculationStart.setDate(calculationStart.getDate() - 14)
        const calculationEnd = new Date(year, monthIndex, daysInMonth + 7)

        const weeklyPayMap: Record<string, number> = {}
        const dailyEarnings: Record<string, number> = {}

        let curr = new Date(calculationStart)
        while (curr <= calculationEnd) {
            const dateUTC = Date.UTC(curr.getFullYear(), curr.getMonth(), curr.getDate())
            const diffDays = Math.round((dateUTC - ROTA_ANCHOR_UTC) / 86400000)
            const cycleDay = ((diffDays % 6) + 6) % 6
            const isShift = cycleDay < 3

            const dateStr = curr.toISOString().split('T')[0]
            const override = allOverrides[dateStr]

            let isWorked = isShift && override !== 'absence'
            let isOT = override === 'overtime'
            let isHol = isShift && override === 'holiday'

            let gross = 0
            if (isWorked || isHol) gross += HOURS_PER_SHIFT * BASE_RATE
            if (isOT) gross += HOURS_PER_SHIFT * OT_RATE

            dailyEarnings[dateStr] = gross * (1 - DEDUCTION_RATE)

            const dayOfWeek = curr.getDay()
            const daysUntilSaturday = 6 - dayOfWeek

            const accountingSat = new Date(curr)
            accountingSat.setDate(curr.getDate() + daysUntilSaturday)

            const paydayFri = new Date(accountingSat)
            paydayFri.setDate(accountingSat.getDate() + 6)

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

        for (let i = 0; i < firstDayIdx; i++) {
            daysArr.push(null)
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, monthIndex, day)
            date.setHours(0, 0, 0, 0)
            const dateStr = date.toISOString().split('T')[0]

            const dateUTC = Date.UTC(year, monthIndex, day)
            const diffDays = Math.round((dateUTC - ROTA_ANCHOR_UTC) / 86400000)
            const cycleDay = ((diffDays % 6) + 6) % 6
            const isShift = cycleDay < 3

            const isPayday = date.getDay() === 5
            const override = allOverrides[dateStr]
            const isStaged = !!dayOverrides[dateStr]
            const isBooked = bookedOverrides.some(o => o.date === dateStr)

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
                isStaged,
                isBooked,
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
    }, [year, monthIndex, allOverrides, dayOverrides, bookedOverrides])

    const nextMonth = () => {
        setCurrentDate(new Date(year, monthIndex + 1, 1))
    }

    const prevMonth = () => {
        setCurrentDate(new Date(year, monthIndex - 1, 1))
    }

    const handleCancelClick = (dateStr: string, type: string) => {
        setItemToCancel({ date: dateStr, type })
        setCancelConfirmOpen(true)
    }

    const confirmCancel = async () => {
        if (!itemToCancel) return
        try {
            await deleteOverrideByDate(itemToCancel.date)
            setCancelConfirmOpen(false)
            setItemToCancel(null)
        } catch (err) {
            console.error(err)
            alert("Failed to cancel booking.")
        }
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

                            const { day, isShift, isPayday, isToday, override, dateStr, isStaged, isBooked } = d
                            const isOvertime = override === 'overtime'
                            const isAbsence = override === 'absence'
                            const isHoliday = override === 'holiday'

                            const handleClick = () => {
                                if (isBooked) {
                                    handleCancelClick(dateStr, override!)
                                    return
                                }

                                // Toggle staged state
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
                            let borderClass = "border-black/[0.08]"
                            let textClass = "text-black/60"

                            if (isOvertime) {
                                bgClass = isBooked ? "bg-orange-100 border-orange-200" : "bg-orange-50/50 border-orange-200/50 border-dashed"
                                textClass = "text-orange-900"
                            } else if (isAbsence) {
                                bgClass = isBooked ? "bg-red-100 border-red-200" : "bg-red-50/50 border-red-200/50 border-dashed"
                                textClass = "text-red-900"
                            } else if (isHoliday) {
                                bgClass = isBooked ? "bg-purple-100 border-purple-200" : "bg-purple-50/50 border-purple-200/50 border-dashed"
                                textClass = "text-purple-900"
                            } else if (isShift && isPayday) {
                                bgClass = "bg-[#dbeafe]"
                                borderClass = "border-emerald-300"
                                textClass = "text-blue-900"
                            } else if (isShift) {
                                bgClass = "bg-[#dbeafe]"
                                textClass = "text-blue-900"
                            } else if (isPayday) {
                                bgClass = "bg-[#d1fae5]"
                                textClass = "text-emerald-900"
                            }

                            if (isToday) {
                                borderClass = "border-black shadow-sm"
                            }

                            return (
                                <div
                                    key={i}
                                    onClick={handleClick}
                                    className={`aspect-square cursor-pointer hover:border-black/20 relative rounded-xl border p-1.5 sm:p-2 sm:pt-1.5 transition-all flex flex-col justify-between select-none ${bgClass} ${borderClass} ${isBooked ? 'ring-1 ring-black/5 shadow-sm' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className={`text-[12px] sm:text-[14px] font-bold ${textClass}`}>{day}</span>
                                            {isOvertime && (
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-[8px] sm:text-[9px] bg-orange-500 text-white px-1 py-0.5 rounded font-bold tracking-widest uppercase shadow-sm ${!isBooked && 'opacity-50'}`}>OT</span>
                                                    {isBooked && <Check className="w-2.5 h-2.5 text-orange-600" />}
                                                </div>
                                            )}
                                            {isAbsence && (
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-[8px] sm:text-[9px] bg-red-500 text-white px-1 py-0.5 rounded font-bold tracking-widest uppercase shadow-sm ${!isBooked && 'opacity-50'}`}>ABS</span>
                                                    {isBooked && <Check className="w-2.5 h-2.5 text-red-600" />}
                                                </div>
                                            )}
                                            {isHoliday && (
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-[8px] sm:text-[9px] bg-purple-500 text-white px-1 py-0.5 rounded font-bold tracking-widest uppercase shadow-sm ${!isBooked && 'opacity-50'}`}>HOL</span>
                                                    {isBooked && <Check className="w-2.5 h-2.5 text-purple-600" />}
                                                </div>
                                            )}
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

                    {(activeStaged.abs.length > 0 || activeStaged.hol.length > 0 || activeStaged.ot.length > 0) && (
                        <div className="mt-5 p-4 rounded-xl border border-black/[0.08] bg-black/[0.02] flex items-center justify-between">
                            <div className="text-[13px] font-semibold text-black/70 flex flex-wrap gap-2 items-center">
                                Pending Overrides
                                <div className="flex gap-1">
                                    {activeStaged.abs.length > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-[10px] uppercase font-bold text-red-700">{activeStaged.abs.length} ABS</span>}
                                    {activeStaged.hol.length > 0 && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[10px] uppercase font-bold text-purple-700">{activeStaged.hol.length} HOL</span>}
                                    {activeStaged.ot.length > 0 && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[10px] uppercase font-bold text-orange-700">{activeStaged.ot.length} OT</span>}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 block sm:hidden md:flex">
                                {activeStaged.abs.length > 0 && (
                                    <button
                                        onClick={() => handleConfirmStaged('absence')}
                                        className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[12px] font-bold hover:bg-red-100 transition-colors"
                                    >
                                        Confirm Absence
                                    </button>
                                )}
                                {activeStaged.hol.length > 0 && (
                                    <button
                                        onClick={handleOpenBooking}
                                        className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-[12px] font-bold hover:bg-purple-100 transition-colors"
                                    >
                                        Book Holiday
                                    </button>
                                )}
                                {activeStaged.ot.length > 0 && (
                                    <button
                                        onClick={() => handleConfirmStaged('overtime')}
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
                            <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200" /> Booked Overtime
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Booked Absence
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200" /> Booked Holiday
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded border border-black/20 border-dashed" /> Staged (Pending)
                        </div>
                    </div>
                </div>
            </div>

            {/* Holiday Booking Modal */}
            {bookingOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                        <div className="p-5 space-y-5">
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100/50">
                                <p className="text-[12px] text-purple-700 leading-relaxed">
                                    <span className="font-bold flex items-center gap-1.5 mb-1">
                                        <Info className="w-3.5 h-3.5" /> Microsoft Forms Note
                                    </span>
                                    We are attempting to **auto-prefill** the form using your details. If any fields are missing, they have also been copied to your clipboard for easy pasting!
                                </p>
                            </div>

                            <div className="space-y-4 pt-1">
                                <div>
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-1.5 block">First Date</label>
                                    <input type="date" value={bookFirst} onChange={e => setBookFirst(e.target.value)} className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-1.5 block">Last Date</label>
                                    <input type="date" value={bookLast} onChange={e => setBookLast(e.target.value)} className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-purple-500" />
                                </div>
                                <div>
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
                                    }} className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-1.5 block">Return Date</label>
                                    <input type="date" value={bookReturn} onChange={e => setBookReturn(e.target.value)} className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-1.5 block">Reason for Leave</label>
                                    <input type="text" value={bookReason} onChange={e => setBookReason(e.target.value)} placeholder="Personal / Holiday" className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-purple-500" />
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-black/[0.06] bg-black/[0.01]">
                            <button onClick={submitBooking} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-purple-600 text-white font-bold text-[15px] hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200">
                                Confirm & Open Forms <ExternalLink className="w-4 h-4 opacity-70" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {cancelConfirmOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCancelConfirmOpen(false)} />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-black mb-2">Cancel {itemToCancel?.type} booking?</h3>
                        <p className="text-[14px] text-black/60 mb-6 leading-relaxed">
                            Are you sure you want to remove this booking from your rota on <span className="font-bold text-black">{itemToCancel?.date}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setCancelConfirmOpen(false)} className="flex-1 py-3 rounded-xl border border-black/[0.1] text-black/60 font-bold text-[14px] hover:bg-black/[0.05] transition-colors">
                                Back
                            </button>
                            <button onClick={confirmCancel} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-[14px] hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
