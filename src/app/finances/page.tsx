import type { Metadata } from 'next'
import { CommandCenter } from '@/features/finance/components/CommandCenter'
import { Suspense } from 'react'

export const metadata: Metadata = {
    title: 'Finances — KarrOS',
    description: 'Finance Command Center — pockets, debts, goals, and AI co-pilot.',
}

export default function FinancesPage() {
    return (
        <Suspense fallback={null}>
            <CommandCenter />
        </Suspense>
    )
}
