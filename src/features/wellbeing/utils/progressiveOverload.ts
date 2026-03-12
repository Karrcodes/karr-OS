import { Exercise, WellbeingProfile, WorkoutLog } from '../types'

export interface OverloadTarget {
    suggestedWeight: number
    suggestedReps: number
    suggestedSets: number
    isBaseline: boolean
}

const BULK_INCREMENT = 2.5 // kg

export function getOverloadTarget(
    exercise: Exercise,
    profile: WellbeingProfile | null,
    workoutLogs: WorkoutLog[]
): OverloadTarget {
    if (exercise.isBodyweight) {
        return {
            suggestedWeight: 0,
            suggestedReps: exercise.suggestedReps,
            suggestedSets: exercise.suggestedSets,
            isBaseline: true
        }
    }

    // 1. Search for historical logs of this exercise
    // Sort logs by newest first
    const sortedLogs = [...workoutLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    for (const log of sortedLogs) {
        const exerciseLog = log.exercises.find(e => e.exerciseId === exercise.id)
        if (exerciseLog && exerciseLog.sets.length > 0) {
            // Found a previous session. Find the max weight successfully lifted
            let maxWeight = 0
            for (const set of exerciseLog.sets) {
                if (set.reps > 0 && set.weight > maxWeight) {
                    maxWeight = set.weight
                }
            }

            if (maxWeight > 0) {
                // Rule: Progressive Overload only applies if the session was VERIFIED by gym data
                const isVerified = !!log.gymVisitId
                
                // Determine increment based on goal AND verification
                let increment = 0
                if (isVerified && profile?.goal === 'bulk') {
                    increment = BULK_INCREMENT
                }

                return {
                    suggestedWeight: maxWeight + increment,
                    suggestedReps: exercise.suggestedReps, // Keep target reps
                    suggestedSets: exercise.suggestedSets,
                    isBaseline: false
                }
            }
        }
    }

    // 2. If no history, calculate a biometric baseline based on body weight
    if (exercise.suggestedWeight !== undefined) {
        return {
            suggestedWeight: exercise.suggestedWeight,
            suggestedReps: exercise.suggestedReps,
            suggestedSets: exercise.suggestedSets,
            isBaseline: true
        }
    }

    const userWeight = profile?.weight || 75 // Default 75kg if no profile
    let multiplier = 0.3 // safe default for isolations (arms/calves)

    const name = exercise.name.toLowerCase()
    const groups = exercise.muscleGroups?.map(g => g.toLowerCase()) || []
    const primaryGroup = exercise.muscleGroup.toLowerCase()
    const allGroups = [primaryGroup, ...groups].join(' ')

    if (name.includes('squat') || allGroups.includes('legs') || allGroups.includes('quads')) {
        multiplier = 1.2
    } else if (name.includes('deadlift') || allGroups.includes('glutes') || allGroups.includes('hamstrings')) {
        multiplier = 1.4
    } else if (name.includes('bench') || name.includes('chest press') || allGroups.includes('chest')) {
        multiplier = 0.9
    } else if (name.includes('row') || name.includes('pull') || allGroups.includes('back')) {
        multiplier = 0.8
    } else if (name.includes('press') || name.includes('shoulder')) {
        multiplier = 0.5
    }

    // Calculate RAW baseline
    const rawBaseline = userWeight * multiplier
    
    // Round to nearest 2.5kg standard plate increment
    const roundedBaseline = Math.round(rawBaseline / 2.5) * 2.5

    return {
        suggestedWeight: roundedBaseline,
        suggestedReps: exercise.suggestedReps,
        suggestedSets: exercise.suggestedSets,
        isBaseline: true
    }
}
