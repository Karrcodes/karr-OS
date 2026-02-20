/**
 * Returns the public image path for a known lender, based on a fuzzy
 * case-insensitive match on the obligation name.
 */
export function getLenderLogo(name: string): string | null {
    const lower = name.toLowerCase()
    if (lower.includes('klarna')) return '/klarna.png'
    if (lower.includes('clearpay')) return '/clearpay.png'
    if (lower.includes('currys')) return '/currys.png'
    return null
}

/** Safely advances a Date by exactly N months, preserving the day-of-month */
export function addMonths(date: Date, months: number): Date {
    const d = new Date(date.getTime())
    const targetMonth = d.getMonth() + months
    d.setMonth(targetMonth)
    if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) d.setDate(0)
    return d
}

/**
 * Returns the number of remaining payments for an obligation.
 * Priority: if paymentsLeftOverride is set (user entered it explicitly), use it directly.
 * Otherwise, iterate actual payment dates from nextDueDate to endDate >= now.
 */
export function countRemainingPayments(
    nextDueDate: string,
    endDate: string | null,
    frequency: string,
    now: Date,
    paymentsLeftOverride?: number | null
): number {
    // Trust the explicitly stored payments_left first — it's what the user entered
    if (paymentsLeftOverride != null && paymentsLeftOverride > 0) {
        return paymentsLeftOverride
    }

    if (!endDate) return 0

    let current = new Date(nextDueDate)
    current.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setDate(end.getDate() + 7) // 7-day grace period
    end.setHours(23, 59, 59, 999)

    // Unbounded obligations (no limit) shouldn't count infinity, but here we count explicit occurrences bounded by `end`.
    // If end is in the past, it aborts early.
    if (end < now) return 0

    let count = 0
    while (current <= end) {
        if (current >= now) count++
        if (frequency === 'monthly') current = addMonths(current, 1)
        else if (frequency === 'weekly') current.setDate(current.getDate() + 7)
        else if (frequency === 'bi-weekly') current.setDate(current.getDate() + 14)
        else if (frequency === 'yearly') current = addMonths(current, 12)
        else break
    }
    return count
}
