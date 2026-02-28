'use client'

import { StudioProvider } from '@/features/studio/context/StudioContext'

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    return (
        <StudioProvider>
            {children}
        </StudioProvider>
    )
}
