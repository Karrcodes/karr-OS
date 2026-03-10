'use client'

import { OverviewTab } from '@/features/wellbeing/components/OverviewTab'
import { useRouter } from 'next/navigation'

export default function HealthOverviewPage() {
    const router = useRouter()

    return <OverviewTab onTabChange={(id) => router.push(`/health/${id === 'overview' ? '' : id}`)} />
}
