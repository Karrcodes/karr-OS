export interface Task {
    id: string
    profile: string
    title: string
    is_completed: boolean
    category: 'todo' | 'grocery' | 'reminder'
    priority: 'super' | 'high' | 'mid' | 'low'
    amount?: string
    due_date?: string
    due_date_mode?: 'on' | 'before' | 'range'
    end_date?: string
    recurrence_config?: {
        type: 'none' | 'daily' | 'weekly' | 'shift_relative'
        interval?: number
        target?: 'on_days' | 'off_days'
        constraint?: 'within_window'
    }
    created_at: string
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
