import type { WorkoutRoutine, Exercise } from '../types'
import { MUSCLE_GROUPS, getMuscleGroupsForExercise } from './fitness-utils'
import { EXERCISES } from '../constants/exercises'

/**
 * Generates a PPL (Push/Pull/Legs) routine that rotates monthly.
 * Rotation Cycles:
 * 1. Hypertrophy (8-12 reps, 3-4 sets)
 * 2. Strength (4-6 reps, 4-5 sets)
 * 3. Volume/Endurance (12-15 reps, 3 sets)
 */
export function getMonthlyRoutine(date: Date): WorkoutRoutine[] {
  const month = date.getMonth()
  const cycle = month % 3 // 0, 1, 2
  
  const intensityMap = [
    { label: 'Hypertrophy', reps: 10, sets: 3 },
    { label: 'Strength', reps: 5, sets: 5 },
    { label: 'Endurance', reps: 15, sets: 3 },
  ]
  
  const currentPhase = intensityMap[cycle]
  
  const routines: WorkoutRoutine[] = [
    {
      id: `push-${month}`,
      name: `Push (Phase: ${currentPhase.label})`,
      day: 'Push Day',
      exercises: [
        createExercise('Bench Press', 'CHEST', currentPhase.reps, currentPhase.sets),
        createExercise('Overhead Press', 'SHOULDERS', currentPhase.reps, currentPhase.sets),
        createExercise('Incline Dumbbell Press', 'CHEST', currentPhase.reps + 2, currentPhase.sets),
        createExercise('Lateral Raises', 'SHOULDERS', 15, 3), // Accessory
        createExercise('Tricep Pushdowns', 'TRICEPS', 12, 3),
      ]
    },
    {
      id: `pull-${month}`,
      name: `Pull (Phase: ${currentPhase.label})`,
      day: 'Pull Day',
      exercises: [
        createExercise('Deadlift', 'BACK', cycle === 1 ? 3 : 8, cycle === 1 ? 5 : 3), // Heavy on strength month
        createExercise('Pullups', 'BACK', 10, 3),
        createExercise('Seated Rows', 'BACK', currentPhase.reps, currentPhase.sets),
        createExercise('Face Pulls', 'SHOULDERS', 15, 3),
        createExercise('Barbell Curls', 'BICEPS', 12, 3),
      ]
    },
    {
      id: `legs-${month}`,
      name: `Legs (Phase: ${currentPhase.label})`,
      day: 'Leg Day',
      exercises: [
        createExercise('Squats', 'LEGS', currentPhase.reps, currentPhase.sets),
        createExercise('Leg Press', 'LEGS', currentPhase.reps + 2, currentPhase.sets),
        createExercise('Leg Curls', 'LEGS', 12, 3),
        createExercise('Leg Extensions', 'LEGS', 12, 3),
        createExercise('Calf Raises', 'LEGS', 15, 4),
      ]
    }
  ]
  
  return routines
}

export function shuffleExercises(routineName: string): Exercise[] {
  const isPush = routineName.toLowerCase().includes('push')
  const isPull = routineName.toLowerCase().includes('pull')
  const isLegs = routineName.toLowerCase().includes('legs')

  const month = new Date().getMonth()
  const cycle = month % 3
  const reps = [10, 5, 15][cycle]
  const sets = [3, 5, 3][cycle]

  const getExercises = (groups: string[], count: number) => {
    const pool = EXERCISES.filter(ex => groups.includes(ex.muscleGroup))
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count).map(ex => ({
      ...ex,
      id: Math.random().toString(36).substr(2, 9),
      suggestedReps: reps,
      suggestedSets: sets
    }))
  }

  if (isPush) {
    return [
      ...getExercises(['Chest'], 2),
      ...getExercises(['Shoulders'], 2),
      ...getExercises(['Triceps'], 1)
    ]
  }
  if (isPull) {
    return [
      ...getExercises(['Back'], 3),
      ...getExercises(['Shoulders'], 1), // Face pulls etc
      ...getExercises(['Biceps'], 1)
    ]
  }
  if (isLegs) {
    return getExercises(['Legs'], 5)
  }

  return []
}

function createExercise(name: string, group: string, reps: number, sets: number): Exercise {
  const bodyweightExercises = ['pullups', 'pushups', 'dips', 'plank', 'squats (bodyweight)']
  const isBodyweight = bodyweightExercises.some(ex => name.toLowerCase().includes(ex))
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    muscleGroup: group,
    muscleGroups: getMuscleGroupsForExercise(name).length > 0 ? getMuscleGroupsForExercise(name) : [group],
    suggestedReps: reps,
    suggestedSets: sets,
    isBodyweight
  }
}
