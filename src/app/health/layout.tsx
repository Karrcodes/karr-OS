'use client'

import { WellbeingProvider } from '@/features/wellbeing/contexts/WellbeingContext'

export default function HealthLayout({ children }: { children: React.ReactNode }) {
    return (
        <WellbeingProvider>
            {children}
        </WellbeingProvider>
    )
}
