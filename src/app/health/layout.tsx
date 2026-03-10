'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { WellbeingProvider, useWellbeing } from '@/features/wellbeing/contexts/WellbeingContext'
import { Plus, Layout, Dumbbell, Utensils, Heart, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { KarrFooter } from '@/components/KarrFooter'
import { ProfileSetup } from '@/features/wellbeing/components/ProfileSetup'
import { GymConnectionModal } from '@/features/wellbeing/components/GymConnectionModal'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { QuickLogModal } from '@/features/wellbeing/components/QuickLogModal'

const TABS = [
    { id: 'overview', label: 'Overview', icon: Layout, href: '/health' },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell, href: '/health/fitness' },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils, href: '/health/nutrition' },
    { id: 'mind', label: 'Mind', icon: Heart, href: '/health/mind' },
]

function HealthLayoutContent({ children }: { children: React.ReactNode }) {
    const { profile, syncGymData, gymStats, weightHistory, loading } = useWellbeing()
    const [isGymModalOpen, setIsGymModalOpen] = useState(false)
    const [isQuickLogOpen, setIsQuickLogOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        if (gymStats.isIntegrated && !loading) {
            syncGymData()
        }
    }, [gymStats.isIntegrated, loading])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em]">Syncing Protocol</p>
                </div>
            </div>
        )
    }

    if (!profile) {
        return <ProfileSetup />
    }

    const latestWeight = weightHistory.length > 0
        ? weightHistory[weightHistory.length - 1].weight
        : profile.weight

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
            <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full flex-grow">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em]">Wellbeing Protocol</h2>
                        <h1 className="text-4xl font-black text-black tracking-tighter uppercase grayscale">Health Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-black/[0.03] border border-black/5 rounded-2xl px-5 py-3 flex items-center gap-4">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-wider">Phase</p>
                                <p className="text-[13px] font-black text-black uppercase">{profile.goal}</p>
                            </div>
                            <div className="w-px h-8 bg-black/10" />
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-wider">Weight</p>
                                <p className="text-[13px] font-black text-black uppercase">{latestWeight}kg</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsQuickLogOpen(true)}
                            className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-black/10"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <Link
                            href="/health/settings"
                            className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border",
                                pathname === '/health/settings'
                                    ? "bg-black text-white border-black"
                                    : "bg-black/[0.03] border-black/5 text-black/40 hover:bg-black/[0.05]"
                            )}
                        >
                            <Settings className="w-5 h-5" />
                        </Link>
                    </div>
                </header>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-2 bg-black/[0.03] p-1.5 rounded-[24px] w-fit border border-black/5">
                    {TABS.map((tab) => {
                        const isTabActive = tab.id === 'overview'
                            ? pathname === '/health'
                            : pathname.startsWith(tab.href)

                        return (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
                                    isTabActive
                                        ? "bg-white text-black shadow-sm border border-black/5"
                                        : "text-black/40 hover:text-black hover:bg-white/50"
                                )}
                            >
                                <tab.icon className={cn("w-4 h-4", isTabActive ? "text-rose-500" : "text-black/20")} />
                                {tab.label}
                            </Link>
                        )
                    })}
                </div>

                {/* Tab Content */}
                <div className="pt-4">
                    {children}
                </div>
            </div>

            <GymConnectionModal
                isOpen={isGymModalOpen}
                onClose={() => setIsGymModalOpen(false)}
            />
            <QuickLogModal
                isOpen={isQuickLogOpen}
                onClose={() => setIsQuickLogOpen(false)}
            />
            <KarrFooter />
        </div>
    )
}

export default function HealthLayout({ children }: { children: React.ReactNode }) {
    return (
        <WellbeingProvider>
            <HealthLayoutContent>
                {children}
            </HealthLayoutContent>
        </WellbeingProvider>
    )
}
