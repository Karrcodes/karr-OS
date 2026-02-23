import { TasksProfileProvider } from '@/features/tasks/contexts/TasksProfileContext'

export default function TasksLayoutWrapper({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <TasksProfileProvider>
            {children}
        </TasksProfileProvider>
    )
}
