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
