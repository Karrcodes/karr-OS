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
