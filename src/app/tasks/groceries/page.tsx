'use client'

import { TasksLayout } from '@/features/tasks/components/TasksLayout'
import { TaskList } from '@/features/tasks/components/TaskList'
import { ShoppingCart } from 'lucide-react'

export default function GroceriesPage() {
    return (
        <TasksLayout>
            <TaskList category="grocery" />
        </TasksLayout>
    )
}
