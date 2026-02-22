// Hardcoded anchor: User states next shift starts on "Monday". 
// Given current date (Feb 20, 2026 - Friday), next Monday is Feb 23, 2026.
export const ROTA_ANCHOR_UTC = Date.UTC(2026, 1, 23) // Month is 0-indexed (1 = Feb)

export function isShiftDay(date: Date): boolean {
    const dateUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.round((dateUTC - ROTA_ANCHOR_UTC) / 86400000)
    const cycleDay = ((diffDays % 6) + 6) % 6
    return cycleDay < 3
}

export function getUpcomingShifts(days: number = 30): Date[] {
    const shifts: Date[] = []
    const start = new Date()
    start.setHours(0, 0, 0, 0)

    for (let i = 0; i < days; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        if (isShiftDay(d)) {
            shifts.push(d)
        }
    }
    return shifts
}
