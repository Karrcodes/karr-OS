import type { Exercise } from '../types'

export const EXERCISES: Exercise[] = [
    { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest', suggestedReps: 8, suggestedSets: 3 },
    { id: 'squat', name: 'Back Squat', muscleGroup: 'Legs', suggestedReps: 5, suggestedSets: 5 },
    { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back', suggestedReps: 5, suggestedSets: 1 },
    { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders', suggestedReps: 8, suggestedSets: 3 },
    { id: 'pull-up', name: 'Pull Ups', muscleGroup: 'Back', suggestedReps: 10, suggestedSets: 3 },
    { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back', suggestedReps: 8, suggestedSets: 3 },
    { id: 'bicep-curl', name: 'Dumbbell Curls', muscleGroup: 'Arms', suggestedReps: 12, suggestedSets: 3 },
    { id: 'tricep-dip', name: 'Dips', muscleGroup: 'Arms', suggestedReps: 10, suggestedSets: 3 },
    { id: 'lateral-raise', name: 'Lateral Raises', muscleGroup: 'Shoulders', suggestedReps: 15, suggestedSets: 3 },
    { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Legs', suggestedReps: 10, suggestedSets: 3 },
]
