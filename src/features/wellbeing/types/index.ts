export type WellbeingGoal = 'bulk' | 'cut' | 'maintenance'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type Gender = 'male' | 'female' | 'other'

export interface WellbeingProfile {
    age: number
    weight: number // in kg
    height: number // in cm
    gender: Gender
    activityLevel: ActivityLevel
    goal: WellbeingGoal
    updatedAt: string
}

export interface MetricEntry {
    date: string
    weight: number
}

export interface MacroTargets {
    calories: number
    protein: number
    fat: number
    carbs: number
}

export interface Exercise {
    id: string
    name: string
    muscleGroup: string
    suggestedReps: number
    suggestedSets: number
    icon?: string
}

export interface WorkoutRoutine {
    id: string
    name: string
    day?: string
    exercises: Exercise[]
}

export interface WorkoutSet {
    reps: number
    weight: number
}

export interface ExerciseLog {
    exerciseId: string
    sets: WorkoutSet[]
}

export interface WorkoutLog {
    id: string
    date: string
    routineId: string
    exercises: ExerciseLog[]
}

export interface GymBusyness {
    status: string
    currentCount: number
    currentPercentage: number
    currentCapacity: number
    lastUpdated: string
}

export interface GymVisit {
    id: string
    date: string
    time: string
    duration?: number // in minutes
    locationName: string
}

export interface TheGymGroupStats {
    totalVisits: number
    lastVisit: string | null
    isIntegrated: boolean
    busyness?: GymBusyness
    weeklyVisits: number
    visitHistory: GymVisit[]
    gymLocationId?: string
    userUuid?: string
    memberId?: string
    accessToken?: string
    debug_raw_history?: any
    debug_raw_busyness?: any
    debug_raw_user?: any
}

export interface Ingredient {
    name: string
    amount: string
    calories: number
    protein: number
    fat: number
    carbs: number
}

export interface Recipe {
    id: string
    name: string
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    prepTime: string
    calories: number
    protein: number
    fat: number
    carbs: number
    ingredients: Ingredient[]
    instructions: string[]
    goal?: 'bulk' | 'cut' | 'all'
    image?: string
}

export interface MealLog {
    id: string
    date: string // ISO string for the day
    time: string // HH:mm
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    name: string
    calories: number
    protein: number
    fat: number
    carbs: number
    isRecipe?: boolean
    recipeId?: string
}

export type MoodValue = 'excellent' | 'good' | 'neutral' | 'low' | 'bad'

export interface MoodEntry {
    id: string
    date: string
    time: string
    value: MoodValue
    note?: string
}

export interface Reflection {
    id: string
    date: string
    content: string
}

export interface WaterLog {
    id: string
    date: string
    amount: number // in ml
}

export type DashboardComponentId =
    | 'macros'
    | 'weight_trends'
    | 'active_protocol'
    | 'meal_planner'
    | 'mood_reflection'
    | 'nutritional_trends'
    | 'workout_consistency'
    | 'gym_activity'

export interface DashboardLayout {
    main: { id: DashboardComponentId; isVisible: boolean }[]
    sidebar: { id: DashboardComponentId; isVisible: boolean }[]
}

export interface WellbeingState {
    profile: WellbeingProfile | null
    weightHistory: MetricEntry[]
    routines: WorkoutRoutine[]
    activeRoutineId: string | null
    workoutLogs: WorkoutLog[]
    gymStats: TheGymGroupStats
    mealLogs: MealLog[]
    savedRecipes: string[] // Array of recipe IDs
    moodLogs: MoodEntry[]
    reflections: Reflection[]
    waterLogs: WaterLog[]
    dashboardLayout: DashboardLayout
    loading: boolean
}
