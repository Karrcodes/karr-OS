export interface Task {
    id: string
    profile: 'personal' | 'business'
    title: string
    is_completed: boolean
    category: 'todo' | 'grocery'
    created_at: string
}
