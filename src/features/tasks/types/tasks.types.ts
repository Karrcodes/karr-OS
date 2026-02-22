export interface Task {
    id: string
    profile: 'personal' | 'business'
    title: string
    is_completed: boolean
    category: 'todo' | 'grocery'
    priority: 'super' | 'high' | 'mid' | 'low'
    due_date?: string
    created_at: string
}
