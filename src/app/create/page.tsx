'use client'

import StudioDashboard from '@/features/studio/components/StudioDashboard'

export default function CreateDashboardPage() {
    return (
        <main className="min-h-screen bg-[#FAFAFA] pb-24 pt-4 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <StudioDashboard />
            </div>
        </main>
    )
}
