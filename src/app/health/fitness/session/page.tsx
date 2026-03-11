import { WorkoutSession } from '@/features/wellbeing/components/WorkoutSession'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Workout Session | Schrö',
    description: 'Track your active workout protocol with real-time set and rep logging.'
}

export default function SessionPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <WorkoutSession />
        </div>
    )
}
