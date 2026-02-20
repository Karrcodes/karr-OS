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

/**
 * Counts the exact number of payments remaining from next_due_date to end_date,
 * only counting dates >= today. More accurate than monthsLeft arithmetic which
 * misses payments in the current calendar month.
 */
export function countRemainingPayments(
    nextDueDate: string,
    endDate: string | null,
    frequency: string,
    now: Date
): number {
    if (!endDate) return 0

    let current = new Date(nextDueDate)
    current.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    if (end < now) return 0

    let count = 0
    while (current <= end) {
        if (current >= now) count++
        if (frequency === 'monthly') current.setMonth(current.getMonth() + 1)
        else if (frequency === 'weekly') current.setDate(current.getDate() + 7)
        else if (frequency === 'bi-weekly') current.setDate(current.getDate() + 14)
        else if (frequency === 'yearly') current.setFullYear(current.getFullYear() + 1)
        else break
    }
    return count
}
