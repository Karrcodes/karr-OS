import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import type { WellbeingProfile, MetricEntry, MacroTargets, WellbeingState, WellbeingGoal, ActivityLevel, WorkoutRoutine, WorkoutLog, TheGymGroupStats, MealLog, MoodValue, MoodEntry, Reflection, GymBusyness, GymVisit, DashboardLayout } from '../types'
import { GymService } from '../services/gymService'
import { supabase } from '@/lib/supabase'

interface WellbeingContextType extends WellbeingState {
    updateProfile: (profile: WellbeingProfile) => Promise<void>
    logWeight: (weight: number) => Promise<void>
    calculateTDEE: (profile: WellbeingProfile) => number
    logWorkout: (log: WorkoutLog) => Promise<void>
    connectGym: (username: string, pin: string, locationId: string) => Promise<void>
    syncGymData: () => Promise<void>
    addRoutine: (routine: WorkoutRoutine) => Promise<void>
    updateGymStats: (stats: Partial<TheGymGroupStats>) => Promise<void>
    logMeal: (meal: Omit<MealLog, 'id'>) => Promise<void>
    saveRecipe: (recipeId: string) => Promise<void>
    logMood: (value: MoodValue, note?: string) => Promise<void>
    saveReflection: (content: string) => Promise<void>
    updateLayout: (layout: DashboardLayout) => Promise<void>
    macros: MacroTargets
    dailyNutrition: MacroTargets
}

export const WellbeingContext = createContext<WellbeingContextType | undefined>(undefined)

const INITIAL_STATE: WellbeingState = {
    profile: null,
    weightHistory: [],
    routines: [],
    activeRoutineId: null,
    workoutLogs: [],
    gymStats: {
        totalVisits: 0,
        lastVisit: null,
        isIntegrated: false,
        weeklyVisits: 0,
        visitHistory: []
    },
    mealLogs: [],
    savedRecipes: [],
    moodLogs: [],
    reflections: [],
    dashboardLayout: {
        main: [
            { id: 'macros', isVisible: true },
            { id: 'weight_trends', isVisible: true },
            { id: 'active_protocol', isVisible: true },
            { id: 'meal_planner', isVisible: true },
            { id: 'mood_reflection', isVisible: true },
        ],
        sidebar: [
            { id: 'nutritional_trends', isVisible: true },
            { id: 'workout_consistency', isVisible: true },
            { id: 'gym_activity', isVisible: true },
        ]
    },
    loading: true
}

const MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
}

export function WellbeingProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<WellbeingState>(INITIAL_STATE)

    // Load Initial Data
    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            // Try loading from LocalStorage first for instant UI
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('wellbeing_state')
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved)
                        setState(prev => ({ ...prev, ...parsed, loading: user ? prev.loading : false }))
                    } catch (e) {
                        console.error('Failed to parse local wellbeing state:', e)
                    }
                }
            }

            if (user) {
                try {
                    const [profileRes, dataRes] = await Promise.all([
                        supabase.from('wellbeing_profiles').select('*').eq('user_id', user.id).single(),
                        supabase.from('wellbeing_data').select('*').eq('user_id', user.id).single()
                    ])

                    const newState: Partial<WellbeingState> = {}

                    if (profileRes.data) {
                        newState.profile = {
                            age: profileRes.data.age,
                            weight: profileRes.data.weight,
                            height: profileRes.data.height,
                            gender: profileRes.data.gender,
                            activityLevel: profileRes.data.activity_level,
                            goal: profileRes.data.goal,
                            updatedAt: profileRes.data.updated_at
                        }
                    }

                    if (dataRes.data) {
                        newState.weightHistory = dataRes.data.weight_history || []
                        newState.routines = dataRes.data.routines || []
                        newState.activeRoutineId = dataRes.data.active_routine_id || null
                        newState.workoutLogs = dataRes.data.workout_logs || []
                        newState.gymStats = dataRes.data.gym_stats || INITIAL_STATE.gymStats
                        newState.mealLogs = dataRes.data.meal_logs || []
                        newState.savedRecipes = dataRes.data.saved_recipes || []
                        newState.moodLogs = dataRes.data.mood_logs || []
                        newState.reflections = dataRes.data.reflections || []
                        newState.dashboardLayout = dataRes.data.dashboard_layout || INITIAL_STATE.dashboardLayout
                    }

                    setState(prev => ({
                        ...prev,
                        ...newState,
                        loading: false
                    }))
                } catch (e) {
                    console.error('Failed to sync with Supabase:', e)
                    setState(prev => ({ ...prev, loading: false }))
                }
            } else {
                setState(prev => ({ ...prev, loading: false }))
            }
        }

        loadInitialData()
    }, [])

    // Sync to LocalStorage (as cache)
    useEffect(() => {
        if (!state.loading) {
            localStorage.setItem('wellbeing_state', JSON.stringify(state))
        }
    }, [state])

    // Periodic sync for Gym Data
    useEffect(() => {
        if (state.gymStats.isIntegrated && !state.loading) {
            syncGymData()
            const interval = setInterval(syncGymData, 1000 * 60 * 30)
            return () => clearInterval(interval)
        }
    }, [state.gymStats.isIntegrated, state.loading])

    // Helper to persist to Supabase
    const persistData = async (data: Partial<{
        profile: WellbeingProfile,
        weightHistory: MetricEntry[],
        routines: WorkoutRoutine[],
        activeRoutineId: string | null,
        workoutLogs: WorkoutLog[],
        gymStats: TheGymGroupStats,
        mealLogs: MealLog[],
        savedRecipes: string[],
        moodLogs: MoodEntry[],
        reflections: Reflection[],
        dashboardLayout: DashboardLayout
    }>) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            if (data.profile) {
                await supabase.from('wellbeing_profiles').upsert({
                    user_id: user.id,
                    age: data.profile.age,
                    weight: data.profile.weight,
                    height: data.profile.height,
                    gender: data.profile.gender,
                    activity_level: data.profile.activityLevel,
                    goal: data.profile.goal,
                    updated_at: new Date().toISOString()
                })
            }

            if (data.weightHistory || data.routines || data.activeRoutineId !== undefined || data.workoutLogs || data.gymStats || data.mealLogs || data.savedRecipes || data.moodLogs || data.reflections || data.dashboardLayout) {
                const update: any = { user_id: user.id, updated_at: new Date().toISOString() }
                if (data.weightHistory) update.weight_history = data.weightHistory
                if (data.routines) update.routines = data.routines
                if (data.activeRoutineId !== undefined) update.active_routine_id = data.activeRoutineId
                if (data.workoutLogs) update.workout_logs = data.workoutLogs
                if (data.gymStats) update.gym_stats = data.gymStats
                if (data.mealLogs) update.meal_logs = data.mealLogs
                if (data.savedRecipes) update.saved_recipes = data.savedRecipes
                if (data.moodLogs) update.mood_logs = data.moodLogs
                if (data.reflections) update.reflections = data.reflections
                if (data.dashboardLayout) update.dashboard_layout = data.dashboardLayout

                await supabase.from('wellbeing_data').upsert(update)
            }
        } catch (e) {
            console.error('Persistence error:', e)
        }
    }

    const calculateBMR = (p: WellbeingProfile) => {
        if (p.gender === 'male') {
            return (10 * p.weight) + (6.25 * p.height) - (5 * p.age) + 5
        }
        return (10 * p.weight) + (6.25 * p.height) - (5 * p.age) - 161
    }

    const calculateTDEE = (p: WellbeingProfile) => {
        const bmr = calculateBMR(p)
        return Math.round(bmr * MULTIPLIERS[p.activityLevel])
    }

    const macros = useMemo(() => {
        if (!state.profile) return { calories: 0, protein: 0, fat: 0, carbs: 0 }
        const tdee = calculateTDEE(state.profile)
        let calories = tdee
        if (state.profile.goal === 'bulk') calories += 300
        if (state.profile.goal === 'cut') calories -= 500
        return {
            calories,
            protein: Math.round((calories * 0.3) / 4),
            fat: Math.round((calories * 0.25) / 9),
            carbs: Math.round((calories * 0.45) / 4)
        }
    }, [state.profile])

    const dailyNutrition = useMemo(() => {
        const today = new Date().toISOString().split('T')[0]
        const todayMeals = state.mealLogs.filter((m: MealLog) => m.date === today)
        return todayMeals.reduce((acc: MacroTargets, meal: MealLog) => ({
            calories: acc.calories + meal.calories,
            protein: acc.protein + meal.protein,
            fat: acc.fat + meal.fat,
            carbs: acc.carbs + meal.carbs
        }), { calories: 0, protein: 0, fat: 0, carbs: 0 })
    }, [state.mealLogs])

    const updateProfile = async (profile: WellbeingProfile) => {
        setState((prev: WellbeingState) => ({ ...prev, profile }))
        await persistData({ profile })
    }

    const logWeight = async (weight: number) => {
        const date = new Date().toISOString().split('T')[0]
        const weightHistory = [...state.weightHistory.filter((w: MetricEntry) => w.date !== date), { date, weight }]
        const profile = state.profile ? { ...state.profile, weight } : null

        setState((prev: WellbeingState) => ({
            ...prev,
            weightHistory,
            profile
        }))

        await Promise.all([
            persistData({ weightHistory }),
            profile ? persistData({ profile }) : Promise.resolve()
        ])
    }

    const logWorkout = async (log: WorkoutLog) => {
        const workoutLogs = [...state.workoutLogs, log]
        setState((prev: WellbeingState) => ({
            ...prev,
            workoutLogs
        }))
        await persistData({ workoutLogs })
    }

    const addRoutine = async (routine: WorkoutRoutine) => {
        const routines = [...state.routines, routine]
        const activeRoutineId = state.activeRoutineId || routine.id
        setState((prev: WellbeingState) => ({
            ...prev,
            routines,
            activeRoutineId
        }))
        await persistData({ routines, activeRoutineId })
    }

    const updateGymStats = async (stats: Partial<TheGymGroupStats>) => {
        const gymStats = { ...state.gymStats, ...stats }
        setState((prev: WellbeingState) => ({
            ...prev,
            gymStats
        }))
        await persistData({ gymStats })
    }

    const logMeal = async (meal: Omit<MealLog, 'id'>) => {
        const newMeal: MealLog = {
            ...meal,
            id: Math.random().toString(36).substring(2, 9),
            date: new Date().toISOString().split('T')[0]
        }
        const mealLogs = [...state.mealLogs, newMeal]
        setState((prev: WellbeingState) => ({
            ...prev,
            mealLogs
        }))
        await persistData({ mealLogs })
    }

    const saveRecipe = async (recipeId: string) => {
        const savedRecipes = state.savedRecipes.includes(recipeId)
            ? state.savedRecipes
            : [...state.savedRecipes, recipeId]
        setState((prev: WellbeingState) => ({
            ...prev,
            savedRecipes
        }))
        await persistData({ savedRecipes })
    }

    const logMood = async (value: MoodValue, note?: string) => {
        const newEntry: MoodEntry = {
            id: Math.random().toString(36).substring(2, 9),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value,
            note
        }
        const moodLogs = [newEntry, ...state.moodLogs].slice(0, 100)
        setState((prev: WellbeingState) => ({
            ...prev,
            moodLogs
        }))
        await persistData({ moodLogs })
    }

    const saveReflection = async (content: string) => {
        const newReflection: Reflection = {
            id: Math.random().toString(36).substring(2, 9),
            date: new Date().toISOString().split('T')[0],
            content
        }
        const reflections = [newReflection, ...state.reflections].slice(0, 50)
        setState((prev: WellbeingState) => ({
            ...prev,
            reflections
        }))
        await persistData({ reflections })
    }

    const updateLayout = async (dashboardLayout: DashboardLayout) => {
        setState((prev: WellbeingState) => ({
            ...prev,
            dashboardLayout
        }))
        await persistData({ dashboardLayout })
    }

    const syncGymData = async () => {
        const auth = typeof window !== 'undefined' ? localStorage.getItem('gym_auth') : null
        if (!auth || !state.gymStats.isIntegrated) return

        try {
            const { uuid, cookie, memberId, accessToken } = JSON.parse(auth)
            const locationId = state.gymStats.gymLocationId
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)

            const [busynessRes, historyRes] = await Promise.allSettled([
                GymService.getBusyness(uuid, locationId || '', cookie, memberId, accessToken),
                GymService.getHistory(uuid, cookie)
            ])

            const busyness = busynessRes.status === 'fulfilled' ? busynessRes.value : { error: true, message: busynessRes.reason.message }
            const history = historyRes.status === 'fulfilled' ? historyRes.value : { error: true, message: historyRes.reason.message }

            const historyArray = history.error ? [] : (Array.isArray(history) ? history : (history.results || history.data || history.checkIns || []))
            const weeklyVisits = historyArray.filter((v: any) => {
                const date = new Date(v.startTime || v.checkInDate)
                return !isNaN(date.getTime()) && date > weekAgo
            }).length

            const newGymStats = {
                ...state.gymStats,
                isIntegrated: true,
                busyness: (busyness as any).error ? null : busyness,
                weeklyVisits,
                totalVisits: historyArray.length,
                lastVisit: historyArray[0]?.startTime || historyArray[0]?.checkInDate || null,
                visitHistory: historyArray.map((v: any) => {
                    const dateStr = v.startTime || v.checkInDate || ''
                    return {
                        id: v.id || Math.random().toString(36).substring(2, 9),
                        date: dateStr.split('T')[0],
                        time: dateStr.split('T')[1]?.substring(0, 5) || '--:--',
                        locationName: v.gymLocationName || v.gymName || 'Unknown Location'
                    }
                }),
                debug_raw_history: history,
                debug_raw_busyness: busyness
            }

            setState((prev: WellbeingState) => ({
                ...prev,
                gymStats: newGymStats
            }))
            await persistData({ gymStats: newGymStats })
        } catch (e) {
            console.error('Gym sync failed:', e)
        }
    }

    const connectGym = async (username: string, pin: string, locationId: string) => {
        try {
            const data = await GymService.login(username, pin)
            const { uuid, cookie, homeGymId, memberId, accessToken, rawUser } = data

            localStorage.setItem('gym_auth', JSON.stringify({ uuid, cookie, memberId, accessToken }))

            const newLocationId = homeGymId || locationId

            const newGymStats = {
                ...state.gymStats,
                isIntegrated: true,
                gymLocationId: newLocationId,
                userUuid: uuid,
                memberId: memberId,
                debug_raw_user: rawUser
            }

            setState((prev: WellbeingState) => ({
                ...prev,
                gymStats: newGymStats
            }))
            await persistData({ gymStats: newGymStats })
        } catch (e) {
            throw e
        }
    }

    const value = useMemo(() => ({
        ...state,
        updateProfile,
        logWeight,
        calculateTDEE,
        logWorkout,
        connectGym,
        syncGymData,
        addRoutine,
        updateGymStats,
        logMeal,
        saveRecipe,
        logMood,
        saveReflection,
        updateLayout,
        macros,
        dailyNutrition
    }), [state, macros, dailyNutrition])

    return (
        <WellbeingContext.Provider value={value}>
            {children}
        </WellbeingContext.Provider>
    )
}

export function useWellbeing() {
    const context = useContext(WellbeingContext)
    if (context === undefined) {
        throw new Error('useWellbeing must be used within a WellbeingProvider')
    }
    return context
}
