import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import type { WellbeingProfile, MetricEntry, MacroTargets, WellbeingState, WellbeingGoal, ActivityLevel, WorkoutRoutine, WorkoutLog, TheGymGroupStats, MealLog, MoodValue, MoodEntry, Reflection, GymBusyness, GymVisit, DashboardLayout, LibraryMeal, FridgeItem, Milestone } from '../types'
import { GymService } from '../services/gymService'
import { supabase } from '@/lib/supabase'
import { getGymRecommendation } from '../utils/fitness-utils'
import { getMonthlyRoutine } from '../utils/routine-generator'
import type { RotaOverride } from '@/features/finance/types/finance.types'

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
    updateMealLog: (id: string, updates: Partial<MealLog>) => Promise<void>
    deleteMealLog: (id: string) => Promise<void>
    saveRecipe: (recipeId: string) => Promise<void>
    logMood: (value: MoodValue, note?: string) => Promise<void>
    saveReflection: (content: string) => Promise<void>
    updateLayout: (layout: DashboardLayout) => Promise<void>
    addMealToLibrary: (meal: Omit<LibraryMeal, 'id'>) => Promise<void>
    removeMealFromLibrary: (id: string) => Promise<void>
    updateLibraryMeal: (id: string, updates: Partial<LibraryMeal>) => Promise<void>
    addPrepToFridge: (mealId: string, portions: number) => Promise<void>
    consumeFromFridge: (fridgeId: string) => Promise<void>
    removeFromFridge: (fridgeId: string) => Promise<void>
    addMilestone: (milestone: Omit<Milestone, 'id' | 'completed'>) => Promise<void>
    updateMilestone: (id: string, updates: Partial<Milestone>) => Promise<void>
    deleteMilestone: (id: string) => Promise<void>
    macros: MacroTargets
    dailyNutrition: MacroTargets
    gymRecommendation: { status: string; reason: string }
    isSyncingGym: boolean
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
        visitHistory: [],
        lastSyncTime: null
    },
    mealLogs: [],
    library: [],
    fridge: [],
    savedRecipes: [],
    moodLogs: [],
    reflections: [],
    milestones: [],
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
    isSyncingGym: false,
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
    const [rotaOverrides, setRotaOverrides] = useState<RotaOverride[]>([])

    // Load Initial Data
    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser()

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
                    const [profileRes, dataRes, libraryRes, fridgeRes, rotaRes] = await Promise.all([
                        supabase.from('wellbeing_profiles').select('*').eq('user_id', user.id).single(),
                        supabase.from('wellbeing_data').select('*').eq('user_id', user.id).single(),
                        supabase.from('nutrition_library').select('*').eq('user_id', user.id),
                        supabase.from('nutrition_fridge').select('*').eq('user_id', user.id),
                        supabase.from('fin_rota_overrides').select('*').eq('profile', 'Personal')
                    ])

                    const newState: Partial<WellbeingState> = {
                        library: libraryRes.data?.map(m => ({
                            id: m.id,
                            name: m.name,
                            type: m.type || 'snack',
                            emoji: m.emoji,
                            calories: m.calories,
                            protein: m.protein,
                            carbs: m.carbs,
                            fat: m.fat,
                            ingredients: m.ingredients
                        })) || [],
                        fridge: fridgeRes.data?.map(f => ({
                            id: f.id,
                            mealId: f.meal_id,
                            portions: f.portions,
                            prepDate: f.prep_date
                        })) || []
                    }

                    if (profileRes.data) {
                        newState.profile = {
                            age: profileRes.data.age,
                            weight: profileRes.data.weight,
                            height: profileRes.data.height,
                            gender: profileRes.data.gender,
                            activityLevel: profileRes.data.activity_level,
                            goal: profileRes.data.goal,
                            goalWeight: profileRes.data.goal_weight,
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
                        newState.milestones = dataRes.data.milestones || []
                        if (dataRes.data.dashboard_layout) {
                            newState.dashboardLayout = dataRes.data.dashboard_layout
                        }
                    }

                    if (rotaRes.data) {
                        setRotaOverrides(rotaRes.data)
                    }

                    setState(prev => {
                        const updatedState = { ...prev, ...newState, loading: false }
                        if (updatedState.routines.length === 0) {
                            updatedState.routines = getMonthlyRoutine(new Date())
                            updatedState.activeRoutineId = updatedState.routines[0].id
                        }
                        return updatedState
                    })
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

    useEffect(() => {
        if (!state.loading) {
            localStorage.setItem('wellbeing_state', JSON.stringify(state))
        }
    }, [state])

    const persistData = async (data: Partial<WellbeingState>) => {
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
                    goal_weight: data.profile.goalWeight,
                    updated_at: new Date().toISOString()
                })
            }
            if (data.weightHistory || data.routines || data.activeRoutineId !== undefined || data.workoutLogs || data.gymStats || data.mealLogs || data.savedRecipes || data.moodLogs || data.reflections || data.milestones || data.dashboardLayout) {
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
                if (data.milestones) update.milestones = data.milestones
                if (data.dashboardLayout) update.dashboard_layout = data.dashboardLayout
                await supabase.from('wellbeing_data').upsert(update)
            }
        } catch (e) { console.error('Persistence error:', e) }
    }

    const calculateTDEE = (p: WellbeingProfile) => {
        const activeWeight = p.goalWeight || p.weight
        const bmr = p.gender === 'male' 
            ? (10 * activeWeight) + (6.25 * p.height) - (5 * p.age) + 5
            : (10 * activeWeight) + (6.25 * p.height) - (5 * p.age) - 161
        return Math.round(bmr * (MULTIPLIERS[p.activityLevel] || MULTIPLIERS.sedentary))
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
        const todayMeals = state.mealLogs.filter(m => m.date === today)
        return todayMeals.reduce((acc, meal) => ({
            calories: acc.calories + meal.calories,
            protein: acc.protein + meal.protein,
            fat: acc.fat + meal.fat,
            carbs: acc.carbs + meal.carbs
        }), { calories: 0, protein: 0, fat: 0, carbs: 0 })
    }, [state.mealLogs])

    const gymRecommendation = useMemo(() => {
        return getGymRecommendation(new Date(), rotaOverrides, state.workoutLogs)
    }, [rotaOverrides, state.workoutLogs])

    const updateProfile = async (profile: WellbeingProfile) => {
        setState(prev => ({ ...prev, profile }))
        await persistData({ profile })
    }

    const logWeight = async (weight: number) => {
        const date = new Date().toISOString().split('T')[0]
        const weightHistory = [...state.weightHistory.filter(w => w.date !== date), { date, weight }]
        const profile = state.profile ? { ...state.profile, weight } : null
        setState(prev => ({ ...prev, weightHistory, profile }))
        await persistData({ weightHistory, profile: profile || undefined })
    }

    const logWorkout = async (log: WorkoutLog) => {
        // Ascribe to gym visit if possible
        const today = new Date().toISOString().split('T')[0]
        const todayVisit = state.gymStats.visitHistory?.find(v => v.date === today)
        
        const finalLog = {
            ...log,
            gymVisitId: todayVisit?.id || log.gymVisitId
        }
        
        const workoutLogs = [...state.workoutLogs, finalLog]
        setState(prev => ({ ...prev, workoutLogs }))
        await persistData({ workoutLogs })
    }

    const addRoutine = async (routine: WorkoutRoutine) => {
        const routines = [...state.routines, routine]
        const activeRoutineId = state.activeRoutineId || routine.id
        setState(prev => ({ ...prev, routines, activeRoutineId }))
        await persistData({ routines, activeRoutineId })
    }

    const updateGymStats = async (stats: Partial<TheGymGroupStats>) => {
        const gymStats = { ...state.gymStats, ...stats }
        setState(prev => ({ ...prev, gymStats }))
        await persistData({ gymStats })
    }

    const logMeal = async (meal: Omit<MealLog, 'id'>) => {
        const newMeal: MealLog = {
            ...meal,
            id: Math.random().toString(36).substring(2, 9),
            date: new Date().toISOString().split('T')[0]
        }
        const mealLogs = [...state.mealLogs, newMeal]
        setState(prev => ({ ...prev, mealLogs }))
        await persistData({ mealLogs })
    }

    const deleteMealLog = async (id: string) => {
        const mealLogs = state.mealLogs.filter(m => m.id !== id)
        setState(prev => ({ ...prev, mealLogs }))
        await persistData({ mealLogs })
    }

    const updateMealLog = async (id: string, updates: Partial<MealLog>) => {
        const mealLogs = state.mealLogs.map(m => m.id === id ? { ...m, ...updates } : m)
        setState(prev => ({ ...prev, mealLogs }))
        await persistData({ mealLogs })
    }

    const saveRecipe = async (recipeId: string) => {
        const savedRecipes = state.savedRecipes.includes(recipeId) ? state.savedRecipes : [...state.savedRecipes, recipeId]
        setState(prev => ({ ...prev, savedRecipes }))
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
        setState(prev => ({ ...prev, moodLogs }))
        await persistData({ moodLogs })
    }

    const saveReflection = async (content: string) => {
        const newReflection: Reflection = {
            id: Math.random().toString(36).substring(2, 9),
            date: new Date().toISOString().split('T')[0],
            content
        }
        const reflections = [newReflection, ...state.reflections].slice(0, 50)
        setState(prev => ({ ...prev, reflections }))
        await persistData({ reflections })
    }

    const updateLayout = async (dashboardLayout: DashboardLayout) => {
        setState(prev => ({ ...prev, dashboardLayout }))
        await persistData({ dashboardLayout })
    }

    const addMilestone = async (milestone: Omit<Milestone, 'id' | 'completed'>) => {
        const newMilestone: Milestone = {
            ...milestone,
            id: Math.random().toString(36).substring(2, 9),
            completed: false
        }
        const milestones = [...state.milestones, newMilestone]
        setState(prev => ({ ...prev, milestones }))
        await persistData({ milestones })
    }

    const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
        const milestones = state.milestones.map(m => m.id === id ? { ...m, ...updates } : m)
        setState(prev => ({ ...prev, milestones }))
        await persistData({ milestones })
    }

    const deleteMilestone = async (id: string) => {
        const milestones = state.milestones.filter(m => m.id !== id)
        setState(prev => ({ ...prev, milestones }))
        await persistData({ milestones })
    }

    const addMealToLibrary = async (meal: Omit<LibraryMeal, 'id'>) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data, error } = await supabase.from('nutrition_library').insert({
            user_id: user.id,
            ...meal,
            calories: Math.round(Number(meal.calories) || 0),
            protein: Math.round(Number(meal.protein) || 0),
            carbs: Math.round(Number(meal.carbs) || 0),
            fat: Math.round(Number(meal.fat) || 0)
        }).select().single()
        if (!error && data) {
            setState(prev => ({ ...prev, library: [...prev.library, data] }))
        }
    }

    const removeMealFromLibrary = async (id: string) => {
        await supabase.from('nutrition_library').delete().eq('id', id)
        setState(prev => ({ ...prev, library: prev.library.filter(m => m.id !== id) }))
    }

    const updateLibraryMeal = async (id: string, updates: Partial<LibraryMeal>) => {
        await supabase.from('nutrition_library').update(updates).eq('id', id)
        setState(prev => ({ ...prev, library: prev.library.map(m => m.id === id ? { ...m, ...updates } : m) }))
    }

    const addPrepToFridge = async (mealId: string, portions: number) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data, error } = await supabase.from('nutrition_fridge').insert({ user_id: user.id, meal_id: mealId, portions }).select().single()
        if (!error && data) {
            setState(prev => ({ ...prev, fridge: [...prev.fridge, { id: data.id, mealId: data.meal_id, portions: data.portions, prepDate: data.prep_date }] }))
        }
    }

    const consumeFromFridge = async (fridgeId: string) => {
        const item = state.fridge.find(f => f.id === fridgeId)
        if (!item || item.portions <= 0) return
        const meal = state.library.find(m => m.id === item.mealId)
        if (!meal) return
        if (item.portions === 1) {
            await supabase.from('nutrition_fridge').delete().eq('id', fridgeId)
            setState(prev => ({ ...prev, fridge: prev.fridge.filter(f => f.id !== fridgeId) }))
        } else {
            await supabase.from('nutrition_fridge').update({ portions: item.portions - 1 }).eq('id', fridgeId)
            setState(prev => ({ ...prev, fridge: prev.fridge.map(f => f.id === fridgeId ? { ...f, portions: f.portions - 1 } : f) }))
        }
        await logMeal({
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: meal.type,
            name: meal.name,
            emoji: meal.emoji || '🍽️',
            calories: meal.calories,
            protein: meal.protein,
            fat: meal.fat,
            carbs: meal.carbs
        })
    }

    const removeFromFridge = async (fridgeId: string) => {
        await supabase.from('nutrition_fridge').delete().eq('id', fridgeId)
        setState(prev => ({ ...prev, fridge: prev.fridge.filter(f => f.id !== fridgeId) }))
    }

    const syncGymData = async () => {
        const auth = typeof window !== 'undefined' ? localStorage.getItem('gym_auth') : null
        if (!auth || !state.gymStats.isIntegrated) return
        
        setState(prev => ({ ...prev, isSyncingGym: true }))
        
        try {
            const { uuid, cookie, memberId, accessToken } = JSON.parse(auth)
            const [busynessRes, historyRes] = await Promise.allSettled([
                GymService.getBusyness(uuid, state.gymStats.gymLocationId || '', cookie, memberId, accessToken),
                GymService.getHistory(uuid, cookie)
            ])

            let busyness = state.gymStats.busyness
            if (busynessRes.status === 'fulfilled') {
                busyness = busynessRes.value
            }

            let visitHistory = state.gymStats.visitHistory || []
            if (historyRes.status === 'fulfilled') {
                const rawData = historyRes.value
                // Robustly handle both array and object-wrapped history
                const checks = Array.isArray(rawData) ? rawData : (rawData.checkIns || [])
                visitHistory = checks.map((v: any) => ({
                    id: v.id,
                    date: v.date,
                    time: v.time,
                    locationName: v.locationName
                }))
            }

            // Calculate weekly visits
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            const weekAgoStr = weekAgo.toISOString().split('T')[0]
            const weeklyVisits = visitHistory.filter(v => v.date >= weekAgoStr).length

            const gymStats = { 
                ...state.gymStats, 
                busyness: busyness || state.gymStats.busyness,
                visitHistory, 
                weeklyVisits,
                totalVisits: visitHistory.length,
                lastVisit: visitHistory[0] || null,
                lastSyncTime: new Date().toISOString()
            }
            
            setState(prev => ({ ...prev, gymStats, isSyncingGym: false }))
            await persistData({ gymStats })
        } catch (e) { 
            console.error('Gym sync failed:', e) 
            setState(prev => ({ ...prev, isSyncingGym: false }))
        }
    }

    // Periodic Resync (Every 30 mins)
    useEffect(() => {
        if (state.gymStats.isIntegrated && !state.loading) {
            const interval = setInterval(() => {
                syncGymData()
            }, 30 * 60 * 1000)
            return () => clearInterval(interval)
        }
    }, [state.gymStats.isIntegrated, state.loading])

    const connectGym = async (username: string, pin: string, locationId: string) => {
        const data = await GymService.login(username, pin)
        localStorage.setItem('gym_auth', JSON.stringify({ uuid: data.uuid, cookie: data.cookie, member_id: data.memberId, accessToken: data.accessToken }))
        const gymStats = { ...state.gymStats, isIntegrated: true, gymLocationId: data.homeGymId || locationId, userUuid: data.uuid, memberId: data.memberId }
        setState(prev => ({ ...prev, gymStats }))
        await persistData({ gymStats })
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
        updateMealLog,
        deleteMealLog,
        saveRecipe,
        logMood,
        saveReflection,
        updateLayout,
        addMealToLibrary,
        removeMealFromLibrary,
        updateLibraryMeal,
        addPrepToFridge,
        consumeFromFridge,
        removeFromFridge,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        macros,
        dailyNutrition,
        gymRecommendation,
        isSyncingGym: state.isSyncingGym
    }), [state, macros, dailyNutrition, gymRecommendation])

    return <WellbeingContext.Provider value={value}>{children}</WellbeingContext.Provider>
}

export function useWellbeing() {
    const context = useContext(WellbeingContext)
    if (context === undefined) throw new Error('useWellbeing must be used within a WellbeingProvider')
    return context
}
