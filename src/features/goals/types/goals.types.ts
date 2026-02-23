export type GoalCategory = 'finance' | 'health' | 'career' | 'personal'
export type GoalStatus = 'active' | 'completed' | 'archived'
export type GoalPriority = 'super' | 'high' | 'mid' | 'low'
export type GoalTimeframe = 'short' | 'medium' | 'long'

export interface Milestone {
    id: string
    goal_id: string
    title: string
    is_completed: boolean
    position: number
    created_at: string
}

export interface Goal {
    id: string
    user_id: string
    title: string
    description: string | null
    category: GoalCategory
    status: GoalStatus
    target_date: string | null
    priority: GoalPriority
    timeframe: GoalTimeframe
    vision_image_url?: string
    created_at: string
    milestones?: Milestone[]
}

export interface CreateGoalData {
    title: string
    description?: string
    category?: GoalCategory
    target_date?: string
    priority?: GoalPriority
    timeframe?: GoalTimeframe
    vision_image_url?: string
    milestones?: string[] // Array of milestone titles
}
