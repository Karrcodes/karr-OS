export interface Task {
    id: string
    profile: 'personal' | 'business'
    title: string
    is_completed: boolean
    category: 'todo' | 'grocery' | 'reminder'
    priority: 'super' | 'high' | 'mid' | 'low'
    amount?: string
    due_date?: string
    created_at: string
}
