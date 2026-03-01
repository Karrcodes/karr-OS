'use client'

import * as React from 'react'
const { useRef, useState, useEffect, useCallback, useMemo } = React
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion'
import { useStudio } from '../hooks/useStudio'
import { cn } from '@/lib/utils'
import type { StudioProject, ProjectMatrixProps } from '../types/studio.types'
import { Sparkles, RefreshCw, Wallet, Briefcase, Heart, User, Check, X, Beaker, Factory, Tv, TrendingUp, Zap, Clock, Edit2, Calendar } from 'lucide-react'
import ProjectDetailModal from './ProjectDetailModal'

const PRIORITY_COLORS = {
    urgent: 'bg-purple-600 shadow-purple-500/40 text-purple-50',
    high: 'bg-red-500 shadow-red-500/40 text-red-50',
    mid: 'bg-amber-500 shadow-amber-500/40 text-amber-50',
    low: 'bg-neutral-800 shadow-black/40 text-neutral-50'
}

const STRATEGIC_CATEGORIES = [
    { id: 'rnd', label: 'R&D', icon: Beaker, color: 'text-purple-600 bg-purple-50 border-purple-100', dotBgColor: 'bg-purple-500 shadow-purple-500/40' },
    { id: 'production', label: 'Production', icon: Factory, color: 'text-orange-600 bg-orange-50 border-orange-100', dotBgColor: 'bg-orange-500 shadow-orange-500/40' },
    { id: 'media', label: 'Media', icon: Tv, color: 'text-rose-600 bg-rose-50 border-rose-100', dotBgColor: 'bg-rose-500 shadow-rose-500/40' },
    { id: 'growth', label: 'Growth', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', dotBgColor: 'bg-emerald-500 shadow-emerald-500/40' },
    { id: 'personal', label: 'Personal', icon: User, color: 'text-blue-600 bg-blue-50 border-blue-200', dotBgColor: 'bg-blue-600 shadow-blue-500/40' },
] as const

const getPriorityY = (priority: string | undefined): number => {
    switch (priority) {
        case 'urgent': return 12.5
        case 'high': return 37.5
        case 'mid': return 62.5
        case 'low': default: return 87.5
    }
}

const getPriorityFromY = (yPercent: number): string => {
    if (yPercent < 25) return 'urgent'
    if (yPercent < 50) return 'high'
    if (yPercent < 75) return 'mid'
    return 'low'
}

const getUrgencyX = (targetDate: string | undefined | null): number => {
    if (!targetDate) return 92

    const due = new Date(targetDate)
    due.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const clamped = Math.max(0, Math.min(14, diffDays))
    return 16 + (clamped / 14) * 68
}

const getTargetDateFromX = (xPercent: number): string | undefined => {
    if (xPercent > 86) return undefined
    const fraction = Math.max(0, (xPercent - 16) / 68)
    const days = Math.round(fraction * 14)

    if (days > 14) return undefined

    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
}

interface ProjectDotProps {
    project: StudioProject
    containerRef: React.RefObject<HTMLDivElement | null>
    updateProject: any
    finalPosition: { x: number; y: number; density?: 'full' | 'compact' | 'minimal' }
    setSelectedProject: (p: StudioProject | null) => void
    isMoveApplied: boolean
    setHoveredDayIndex: (index: number | null) => void
    isConfirmingMove: boolean
}

function ProjectDot({
    project,
    containerRef,
    updateProject,
    finalPosition,
    setSelectedProject,
    isMoveApplied,
    setHoveredDayIndex,
    isConfirmingMove
}: ProjectDotProps) {
    const [isDragging, setIsDragging] = useState(false)
    const dotRef = useRef<HTMLDivElement>(null)
    const dragStartPos = useRef<{ x: number, y: number } | null>(null)
    const mvX = useMotionValue(0)
    const mvY = useMotionValue(0)

    const syncKey = `${project.id}-${project.priority}-${project.target_date}-${finalPosition.x}-${finalPosition.y}`
    useEffect(() => {
        if (!isDragging && !isConfirmingMove) {
            mvX.set(0)
            mvY.set(0)
        }
    }, [syncKey, isDragging, isConfirmingMove])

    const categoryConfig = STRATEGIC_CATEGORIES.find(c => c.id === project.strategic_category)
    const dotColorClass = categoryConfig ? categoryConfig.dotBgColor : 'bg-neutral-800 shadow-black/40'

    return (
        <motion.div
            drag
            dragConstraints={containerRef}
            dragElastic={0}
            dragMomentum={false}
            onDragStart={() => {
                setIsDragging(true)
                dragStartPos.current = { x: finalPosition.x, y: finalPosition.y }
            }}
            onDrag={(e: any, info: any) => {
                if (!dotRef.current || !containerRef.current) return
                const dotRect = dotRef.current.getBoundingClientRect()
                const containerRect = containerRef.current.getBoundingClientRect()

                const dotCenterX = dotRect.left + dotRect.width / 2
                const dotCenterY = dotRect.top + dotRect.height / 2
                const dropX = dotCenterX - containerRect.left
                const dropY = dotCenterY - containerRect.top

                let xPercent = (dropX / containerRect.width) * 100
                xPercent = Math.max(16, Math.min(84, xPercent))
                const snappedDays = Math.round((xPercent - 16) / 68 * 14)
                setHoveredDayIndex(snappedDays)
            }}
            onDragEnd={(e: any, info: any) => {
                setIsDragging(false)
                setHoveredDayIndex(null)
                if (!dotRef.current || !containerRef.current) return
                const dotRect = dotRef.current.getBoundingClientRect()
                const containerRect = containerRef.current.getBoundingClientRect()

                const dropX = (dotRect.left + dotRect.width / 2) - containerRect.left
                const dropY = (dotRect.top + dotRect.height / 2) - containerRect.top

                let xPercent = (dropX / containerRect.width) * 100
                let yPercent = (dropY / containerRect.height) * 100

                xPercent = Math.max(16, Math.min(84, xPercent))
                yPercent = Math.max(15, Math.min(85, yPercent))

                const snappedDays = Math.round((xPercent - 16) / 68 * 14)
                const snappedX = 16 + (snappedDays / 14) * 68

                updateProject(project.id, {
                    priority: getPriorityFromY(yPercent),
                    target_date: getTargetDateFromX(snappedX),
                    ai_position_x: snappedX,
                    ai_position_y: yPercent
                }, (confirmed: boolean) => {
                    animate(mvX, 0, { type: 'spring', damping: 30, stiffness: 300 })
                    animate(mvY, 0, { type: 'spring', damping: 30, stiffness: 300 })
                })
            }}
            style={{
                x: mvX,
                y: mvY,
                left: `${(isDragging && dragStartPos.current) ? dragStartPos.current.x : finalPosition.x}%`,
                top: `${(isDragging && dragStartPos.current) ? dragStartPos.current.y : finalPosition.y}%`,
                position: 'absolute',
                marginTop: finalPosition.density === 'full' ? '-24px' : '-12px',
                marginLeft: '-12px',
                touchAction: 'none'
            }}
            className={cn(
                "group flex items-center cursor-grab active:cursor-grabbing z-10",
                finalPosition.density === 'full' ? "border p-2 pr-4 h-auto min-h-[44px] rounded-xl bg-white/90 border-black/10 shadow-sm" :
                    finalPosition.density === 'compact' ? "border rounded-lg p-1.5 pr-3 h-6 bg-white/90 border-black/10 shadow-sm" : "p-1.5 w-6 h-6 justify-center"
            )}
            onClick={(e: React.MouseEvent) => {
                if (!isDragging) {
                    e.stopPropagation()
                    setSelectedProject(project)
                }
            }}
        >
            <div ref={dotRef} className={cn("w-3 h-3 rounded-full flex-shrink-0 shadow-sm", dotColorClass)} />
            {finalPosition.density !== 'minimal' && (
                <div className="flex flex-col items-start ml-2.5 overflow-hidden">
                    <span className="text-[10px] font-black tracking-tight leading-none whitespace-nowrap text-black">
                        {project.title}
                    </span>
                </div>
            )}
        </motion.div>
    )
}


export default function ProjectMatrix({
    searchQuery = '',
    filterType = null
}: ProjectMatrixProps) {
    const { projects, updateProject } = useStudio()
    const containerRef = useRef<HTMLDivElement>(null)
    const [selectedProject, setSelectedProject] = useState<StudioProject | null>(null)
    const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all')

    const filteredProjects = useMemo(() => {
        return projects.filter((p: StudioProject) => {
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesType = !filterType || p.type === filterType
            const matchesCat = selectedCategory === 'all' || p.strategic_category === selectedCategory
            const isNotArchived = !p.is_archived

            if (!matchesSearch || !matchesType || !matchesCat || !isNotArchived) return false
            if (!p.target_date) return true

            const diff = (new Date(p.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            return diff >= -1 && diff <= 15
        })
    }, [projects, selectedCategory, searchQuery, filterType])

    const finalPositions = useMemo(() => {
        const positions = filteredProjects.map((p: StudioProject) => {
            const x = p.ai_position_x ?? getUrgencyX(p.target_date)
            const y = p.ai_position_y ?? getPriorityY(p.priority)
            return { id: p.id, x, y, width: 15, height: 5, density: 'full' as const }
        })
        return positions.reduce((acc: Record<string, any>, p: any) => ({ ...acc, [p.id]: p }), {} as Record<string, any>)
    }, [filteredProjects])

    const timelineDates = useMemo(() => {
        const dates = []
        for (let i = 0; i < 15; i++) {
            const d = new Date()
            d.setDate(d.getDate() + i)
            dates.push(d)
        }
        return dates
    }, [])

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={cn("px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all", selectedCategory === 'all' ? "bg-black text-white" : "bg-black/5 text-black/40")}
                    >
                        All
                    </button>
                    {STRATEGIC_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all", selectedCategory === cat.id ? cat.color : "bg-black/5 text-black/30")}
                        >
                            <cat.icon className="w-3.5 h-3.5" />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div ref={containerRef} className="relative w-full bg-white border border-black/[0.08] rounded-[32px] overflow-hidden shadow-sm min-h-[600px]">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-black" />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-black" />
                </div>

                <div className="absolute inset-0 pointer-events-none z-0">
                    {timelineDates.map((_: Date, i: number) => (
                        <div
                            key={i}
                            className={cn("absolute inset-y-0 w-px border-l transition-all duration-300", hoveredDayIndex === i ? "border-black/20" : "border-black/[0.03]")}
                            style={{ left: `${16 + (i / 14) * 68}%` }}
                        />
                    ))}
                </div>

                {filteredProjects.map((p: StudioProject) => (
                    <ProjectDot
                        key={p.id}
                        project={p}
                        containerRef={containerRef}
                        updateProject={updateProject}
                        finalPosition={finalPositions[p.id]}
                        setSelectedProject={setSelectedProject}
                        isMoveApplied={false}
                        setHoveredDayIndex={setHoveredDayIndex}
                        isConfirmingMove={false}
                    />
                ))}

                {/* Legend / Axis Labels */}
                <div className="absolute left-6 top-1/2 -rotate-90 origin-left text-[10px] font-black text-black/10 uppercase tracking-[0.3em]">Strategic Importance</div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-black/10 uppercase tracking-[0.3em]">Urgency (Days to Target)</div>
            </div>

            <ProjectDetailModal
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                project={selectedProject}
            />
        </div>
    )
}
