'use client'

import { TasksLayout } from '@/features/tasks/components/TasksLayout'
import { TasksCalendar } from '@/features/tasks/components/TasksCalendar'

export default function CalendarPage() {
    return (
        <TasksLayout>
            <TasksCalendar />
        </TasksLayout>
    )
}
