/**
 * Shared rota + payday utilities for cron routes.
 * Mirrors the logic from ProjectionsAnalytics.tsx but server-side.
 */

const ROTA_ANCHOR_UTC = Date.UTC(2026, 1, 23) // Feb 23 2026 - Monday

/**
 * Returns true if the given date is a shift day (3-on/3-off starting from anchor).
 */
export function isShiftDay(date: Date): boolean {
    const dateUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.round((dateUTC - ROTA_ANCHOR_UTC) / 86400000)
    const cycleDay = ((diffDays % 6) + 6) % 6
    return cycleDay < 3
}

/**
 * Returns the number of days until the next Friday payday.
 * Pay is issued every Friday.
 */
export function daysUntilNextPayday(from: Date = new Date()): { days: number; date: Date } {
    const today = new Date(from)
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = today.getDay() // 0=Sun, 5=Fri

    let daysUntilFriday = (5 - dayOfWeek + 7) % 7
    if (daysUntilFriday === 0) daysUntilFriday = 7 // If today IS Friday, next payday is next Friday

    const payday = new Date(today)
    payday.setDate(today.getDate() + daysUntilFriday)
    return { days: daysUntilFriday, date: payday }
}

/**
 * Format a number as GBP currency string: £12.34
 */
export function formatGBP(amount: number): string {
    return `£${amount.toFixed(2)}`
}

/**
 * Get today's date string in YYYY-MM-DD format (UTC)
 */
export function todayUTC(): string {
    return new Date().toISOString().split('T')[0]
}
