export interface Task {
    id: string
    profile: 'personal' | 'business'
    title: string
    is_completed: boolean
    category: 'todo' | 'grocery'
    priority: 'super' | 'high' | 'mid' | 'low'
    created_at: string
}
