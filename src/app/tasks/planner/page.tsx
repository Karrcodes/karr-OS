'use client'

import { TasksLayout } from '@/features/tasks/components/TasksLayout'
import { DayPlanner } from '@/features/tasks/components/DayPlanner'

export default function DayPlannerPage() {
    return (
        <TasksLayout>
            <DayPlanner />
        </TasksLayout>
    )
}
