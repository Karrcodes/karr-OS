export interface Task {
    id: string
    profile: string
    title: string
    is_completed: boolean
    category: 'todo' | 'grocery' | 'reminder'
    strategic_category?: 'finance' | 'career' | 'health' | 'personal'
    priority: 'super' | 'high' | 'mid' | 'low'
    amount?: string
    due_date?: string
    due_date_mode?: 'on' | 'before' | 'range'
    end_date?: string
    recurrence_config?: {
        type: 'none' | 'daily' | 'work_days' | 'off_days' | 'custom'
        days_of_week?: number[]   // 0=Sun,1=Mon...6=Sat (used for weekly/custom)
        time?: string             // "HH:MM" for planner placement e.g. "07:00"
        duration_minutes?: number // e.g. 90 for planner block sizing
        // Legacy fields
        interval?: number
        target?: 'on_days' | 'off_days'
        constraint?: 'within_window'
    }
    created_at: string
    position: number
    notes?: {
        type: 'text' | 'bullets' | 'checklist'
        content: any // string for 'text'/'bullets', Array of items for 'checklist'
    }
}

export interface DayPlannerSettings {
    profile: string
    wake_up_time_work: string
    wake_up_time_off: string
    bed_time_work: string
    bed_time_off: string
    meal_times: {
        breakfast: string
        lunch: string
        dinner: string
    }
    workout_duration: number
    shower_duration: number
    meal_prep_duration: number
}
