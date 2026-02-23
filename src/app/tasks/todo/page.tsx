'use client'

import { TasksLayout } from '@/features/tasks/components/TasksLayout'
import { TaskList } from '@/features/tasks/components/TaskList'
import { Activity } from 'lucide-react'

export default function TodoPage() {
    return (
        <TasksLayout>
            <TaskList category="todo" />
        </TasksLayout>
    )
}
