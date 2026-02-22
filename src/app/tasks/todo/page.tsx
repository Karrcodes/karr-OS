'use client'

import { TasksLayout } from '@/features/tasks/components/TasksLayout'
import { TaskList } from '@/features/tasks/components/TaskList'
import { CheckSquare } from 'lucide-react'

export default function TodoPage() {
    return (
        <TasksLayout>
            <TaskList category="todo" title="Action Items" icon={CheckSquare} />
        </TasksLayout>
    )
}
