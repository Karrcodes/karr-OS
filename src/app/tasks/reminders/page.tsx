'use client'

import { TasksLayout } from '@/features/tasks/components/TasksLayout'
import { TaskList } from '@/features/tasks/components/TaskList'
import { Bell } from 'lucide-react'

export default function RemindersPage() {
    return (
        <TasksLayout>
            <TaskList category="reminder" title="Reminders" icon={Bell} />
        </TasksLayout>
    )
}
