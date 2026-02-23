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

export function getNextOffPeriod(startDate: Date = new Date()): { start: Date, end: Date } {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    let current = new Date(start)
    let offDays: Date[] = []

    // Scan up to 7 days to find the next off period
    for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const isOff = !isShiftDay(d)

        if (isOff) {
            // If we find an off day, and it's consecutive with previous off days (or the first one), add it
            if (offDays.length === 0 || (d.getTime() - offDays[offDays.length - 1].getTime()) === 86400000) {
                offDays.push(d)
            } else if (offDays.length > 0) {
                // We found a new off period after a shift break, but we already have one.
                // If we are currently ON days off, we take the current block.
                // If we were working and found the next block, we stop here.
                break
            }
        } else if (offDays.length > 0) {
            // We were in an off period and hit a shift day
            break
        }
    }

    if (offDays.length === 0) return { start: start, end: start }

    return {
        start: offDays[0],
        end: offDays[offDays.length - 1]
    }
}
