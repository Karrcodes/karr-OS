import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import Model, { IExerciseData } from 'react-body-highlighter'

interface MuscleMapProps {
    targetMuscles: string[]
    className?: string
}

export function MuscleMap({ targetMuscles, className }: MuscleMapProps) {
    // Flatten and lowercase all targets for easy matching
    const normalizedTargets = useMemo(() => 
        targetMuscles.map(m => m.toLowerCase()), 
    [targetMuscles])

    // Helper to check if a specific SVG group should be highlighted
    const isHighlighted = (keywords: string[]) => {
        return normalizedTargets.some(target => 
            keywords.some(keyword => target.includes(keyword))
        )
    }

    // Map Schro muscle groups to react-body-highlighter muscle names
    const highlightedData: IExerciseData[] = []
    
    if (isHighlighted(['chest', 'pec'])) highlightedData.push({ name: 'chest', muscles: ['chest'] })
    if (isHighlighted(['shoulder', 'deltoid'])) highlightedData.push({ name: 'shoulders', muscles: ['front-deltoids', 'back-deltoids'] })
    if (isHighlighted(['arm', 'bicep', 'tricep'])) highlightedData.push({ name: 'arms', muscles: ['biceps', 'triceps', 'forearm'] })
    if (isHighlighted(['back', 'lat', 'trap'])) highlightedData.push({ name: 'back', muscles: ['upper-back', 'lower-back', 'trapezius'] })
    if (isHighlighted(['core', 'abs', 'oblique'])) highlightedData.push({ name: 'core', muscles: ['abs', 'obliques'] })
    if (isHighlighted(['leg', 'quad', 'hamstring', 'calf', 'calves', 'glute'])) highlightedData.push({ name: 'legs', muscles: ['quadriceps', 'hamstring', 'calves', 'gluteal'] })

    // If back-dominant exercises are present, show the posterior view, otherwise anterior
    const type = isHighlighted(['back', 'lat', 'trap', 'glute', 'hamstring', 'calf', 'calves']) ? 'posterior' : 'anterior'

    return (
        <div className={cn("w-16 h-32 flex items-center justify-center opacity-90", className)}>
            <Model
                data={highlightedData}
                style={{ width: '100%', height: '100%' }}
                type={type}
                highlightedColors={['#10b981']} // emerald-500
                bodyColor="#ffffff10" // white/10
            />
        </div>
    )
}
