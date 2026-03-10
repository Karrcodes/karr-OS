'use client'

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import type { WellbeingProfile, MetricEntry, MacroTargets, WellbeingState, WellbeingGoal, ActivityLevel, WorkoutRoutine, WorkoutLog, TheGymGroupStats, MealLog, MoodValue, MoodEntry, Reflection, GymBusyness, GymVisit } from '../types'
import { GymService } from '../services/gymService'

interface WellbeingContextType extends WellbeingState {
    updateProfile: (profile: WellbeingProfile) => void
    logWeight: (weight: number) => void
    calculateTDEE: (profile: WellbeingProfile) => number
    logWorkout: (log: WorkoutLog) => void
    connectGym: (username: string, pin: string, locationId: string) => Promise<void>
    syncGymData: () => Promise<void>
    addRoutine: (routine: WorkoutRoutine) => void
    updateGymStats: (stats: Partial<TheGymGroupStats>) => void
    logMeal: (meal: Omit<MealLog, 'id'>) => void
    saveRecipe: (recipeId: string) => void
    logMood: (value: MoodValue, note?: string) => void
    saveReflection: (content: string) => void
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
    reflections: []
}

const MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
}

export function WellbeingProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<WellbeingState>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wellbeing_state')
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch (e) {
                    console.error('Failed to parse wellbeing state:', e)
                }
            }
        }
        return INITIAL_STATE
    })

    useEffect(() => {
        localStorage.setItem('wellbeing_state', JSON.stringify(state))
    }, [state])

    // Periodic sync
    useEffect(() => {
        if (state.gymStats.isIntegrated) {
            syncGymData()
            const interval = setInterval(syncGymData, 1000 * 60 * 30)
            return () => clearInterval(interval)
        }
    }, [state.gymStats.isIntegrated])

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

    const updateProfile = (profile: WellbeingProfile) => {
        setState((prev: WellbeingState) => ({ ...prev, profile }))
    }

    const logWeight = (weight: number) => {
        const date = new Date().toISOString().split('T')[0]
        setState((prev: WellbeingState) => ({
            ...prev,
            weightHistory: [...prev.weightHistory.filter((w: MetricEntry) => w.date !== date), { date, weight }],
            profile: prev.profile ? { ...prev.profile, weight } : null
        }))
    }

    const logWorkout = (log: WorkoutLog) => {
        setState((prev: WellbeingState) => ({
            ...prev,
            workoutLogs: [...prev.workoutLogs, log]
        }))
    }

    const addRoutine = (routine: WorkoutRoutine) => {
        setState((prev: WellbeingState) => ({
            ...prev,
            routines: [...prev.routines, routine],
            activeRoutineId: prev.activeRoutineId || routine.id
        }))
    }

    const updateGymStats = (stats: Partial<TheGymGroupStats>) => {
        setState((prev: WellbeingState) => ({
            ...prev,
            gymStats: { ...prev.gymStats, ...stats }
        }))
    }

    const logMeal = (meal: Omit<MealLog, 'id'>) => {
        const newMeal: MealLog = {
            ...meal,
            id: Math.random().toString(36).substring(2, 9),
            date: new Date().toISOString().split('T')[0]
        }
        setState((prev: WellbeingState) => ({
            ...prev,
            mealLogs: [...prev.mealLogs, newMeal]
        }))
    }

    const saveRecipe = (recipeId: string) => {
        setState((prev: WellbeingState) => ({
            ...prev,
            savedRecipes: prev.savedRecipes.includes(recipeId)
                ? prev.savedRecipes
                : [...prev.savedRecipes, recipeId]
        }))
    }

    const logMood = (value: MoodValue, note?: string) => {
        const newEntry: MoodEntry = {
            id: Math.random().toString(36).substring(2, 9),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value,
            note
        }
        setState((prev: WellbeingState) => ({
            ...prev,
            moodLogs: [newEntry, ...prev.moodLogs].slice(0, 100)
        }))
    }

    const saveReflection = (content: string) => {
        const newReflection: Reflection = {
            id: Math.random().toString(36).substring(2, 9),
            date: new Date().toISOString().split('T')[0],
            content
        }
        setState((prev: WellbeingState) => ({
            ...prev,
            reflections: [newReflection, ...prev.reflections].slice(0, 50)
        }))
    }

    const syncGymData = async () => {
        const auth = typeof window !== 'undefined' ? localStorage.getItem('gym_auth') : null
        if (!auth || !state.gymStats.isIntegrated) return

        try {
            const { uuid, cookie, memberId, accessToken } = JSON.parse(auth)
            const locationId = state.gymStats.gymLocationId
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)

            console.log('Syncing Gym - UUID:', uuid, 'MemberID:', memberId, 'Location:', locationId)

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

            setState((prev: WellbeingState) => ({
                ...prev,
                gymStats: {
                    ...prev.gymStats,
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
            }))
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

            setState((prev: WellbeingState) => ({
                ...prev,
                gymStats: {
                    ...prev.gymStats,
                    isIntegrated: true,
                    gymLocationId: newLocationId,
                    userUuid: uuid,
                    memberId: memberId,
                    debug_raw_user: rawUser
                }
            }))
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
