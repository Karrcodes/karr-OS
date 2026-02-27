import type { Metadata } from 'next'
import { TasksMatrix } from '@/features/tasks/components/TasksMatrix'
import { TasksLayout } from '@/features/tasks/components/TasksLayout'

export const metadata: Metadata = {
    title: 'Matrix — KarrOS',
    description: 'Eisenhower Matrix for task prioritization.',
}

export default function MatrixPage() {
    return (
        <TasksLayout>
            <TasksMatrix />
        </TasksLayout>
    )
}
