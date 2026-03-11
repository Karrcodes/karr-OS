import { WellbeingProfile, Milestone, WorkoutLog } from '../types'

export interface MilestoneBenchmark {
    exerciseName: string
    multiplier: number // Multiplier of bodyweight for intermediate 5RM
    increment: number // Progression step in kg
}

const INTERMEDIATE_BENCHMARKS: MilestoneBenchmark[] = [
    { exerciseName: 'Bench Press', multiplier: 1.0, increment: 2.5 },
    { exerciseName: 'Squat', multiplier: 1.3, increment: 5.0 },
    { exerciseName: 'Deadlift', multiplier: 1.7, increment: 5.0 },
    { exerciseName: 'Overhead Press', multiplier: 0.7, increment: 2.5 },
    { exerciseName: 'Barbell Row', multiplier: 0.8, increment: 2.5 },
]

export function generateInitialMilestones(
    profile: WellbeingProfile,
    workoutLogs: WorkoutLog[]
): Milestone[] {
    const milestones: Milestone[] = []
    const bodyWeight = profile.weight
    const generateId = () => Math.random().toString(36).substring(2, 9)

    // 1. Goal Weight Milestone
    if (profile.goalWeight && Math.abs(profile.goalWeight - bodyWeight) > 0.1) {
        milestones.push({
            id: generateId(),
            title: 'Goal Weight',
            description: `Reach target body weight of ${profile.goalWeight}kg`,
            targetValue: profile.goalWeight,
            currentValue: bodyWeight,
            unit: 'kg',
            type: 'weight',
            completed: false
        })
    }

    // 2. Lift Milestones
    INTERMEDIATE_BENCHMARKS.forEach(benchmark => {
        // Find best historical performance for this exercise
        let bestWeight = 0
        workoutLogs.forEach(log => {
            log.exercises.forEach(ex => {
                // Simplified name matching
                if (ex.exerciseId.toLowerCase().includes(benchmark.exerciseName.toLowerCase()) || 
                    benchmark.exerciseName.toLowerCase().includes(ex.exerciseId.toLowerCase())) {
                    ex.sets.forEach(set => {
                        if (set.weight > bestWeight) bestWeight = set.weight
                    })
                }
            })
        })

        // Calculate starting goal: 
        // If they have no history, start with a conservative intermediate base.
        // If they have history, start with bestWeight + increment.
        const targetValue = bestWeight > 0 
            ? bestWeight + benchmark.increment 
            : Math.round((bodyWeight * benchmark.multiplier) / 2.5) * 2.5 // Round to nearest 2.5kg

        milestones.push({
            id: generateId(),
            title: `${benchmark.exerciseName} (5RM)`,
            description: `Hit ${targetValue}kg for 5 reps`,
            targetValue,
            currentValue: bestWeight,
            unit: 'kg',
            type: 'lift',
            completed: false
        })
    })

    return milestones
}

export function getNextProgressiveMilestone(
    currentMilestone: Milestone
): Milestone {
    const benchmark = INTERMEDIATE_BENCHMARKS.find(b => 
        currentMilestone.title.includes(b.exerciseName)
    )
    
    const increment = benchmark ? benchmark.increment : 2.5

    return {
        ...currentMilestone,
        id: Math.random().toString(36).substring(2, 9),
        targetValue: currentMilestone.targetValue + increment,
        currentValue: currentMilestone.targetValue,
        completed: false,
        dateCompleted: undefined,
        description: `Hit ${currentMilestone.targetValue + increment}kg for 5 reps`
    }
}
