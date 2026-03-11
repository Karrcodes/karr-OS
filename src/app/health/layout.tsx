'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { WellbeingProvider, useWellbeing } from '@/features/wellbeing/contexts/WellbeingContext'
import { Plus, Layout, Dumbbell, Utensils, Heart, Settings, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { KarrFooter } from '@/components/KarrFooter'
import { ProfileSetup } from '@/features/wellbeing/components/ProfileSetup'
import { GymConnectionModal } from '@/features/wellbeing/components/GymConnectionModal'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { QuickLogModal } from '@/features/wellbeing/components/QuickLogModal'

const TABS = [
    { id: 'fitness', label: 'Fitness', icon: Dumbbell, href: '/health/fitness' },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils, href: '/health/nutrition' },
    { id: 'mind', label: 'Mind', icon: Heart, href: '/health/mind' },
]

function HealthLayoutContent({ children }: { children: React.ReactNode }) {
    const { profile, syncGymData, gymStats, weightHistory, loading, isSyncingGym } = useWellbeing()
    const [isGymModalOpen, setIsGymModalOpen] = useState(false)
    const [isQuickLogOpen, setIsQuickLogOpen] = useState(false)
    const pathname = usePathname()

    const [justSynced, setJustSynced] = useState(false)

    useEffect(() => {
        if (gymStats.isIntegrated && !loading) {
            syncGymData()
        }
    }, [gymStats.isIntegrated, loading])

    useEffect(() => {
        if (!isSyncingGym && gymStats.lastSyncTime) {
            const syncTime = new Date(gymStats.lastSyncTime).getTime()
            const now = new Date().getTime()
            if (now - syncTime < 2000) { // If synced in last 2 seconds
                setJustSynced(true)
                const timer = setTimeout(() => setJustSynced(false), 5000)
                return () => clearTimeout(timer)
            }
        }
    }, [isSyncingGym, gymStats.lastSyncTime])

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
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-wider">Current</p>
                                <p className="text-[13px] font-black text-black uppercase">{latestWeight}kg</p>
                            </div>
                            {profile.goalWeight && (
                                <>
                                    <div className="w-px h-8 bg-black/10" />
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-black/30 uppercase tracking-wider">Goal</p>
                                        <p className="text-[13px] font-black text-black uppercase">{profile.goalWeight}kg</p>
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => setIsQuickLogOpen(true)}
                            className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-black/10"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <Link
                            href={pathname === '/health/settings' ? '/health' : '/health/settings'}
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

                {/* Tabs Navigation & Gym Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 bg-black/[0.03] p-1.5 rounded-[24px] w-fit border border-black/5">
                        {TABS.map((tab) => {
                            const isTabActive = pathname.startsWith(tab.href)

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

                    {gymStats.isIntegrated && (
                        <div className="flex items-center gap-3">
                            {gymStats.busyness && (
                                <div className="flex items-center gap-2 px-5 py-3 bg-white border border-black/5 rounded-2xl shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-black uppercase tracking-tight leading-none">
                                            {gymStats.busyness.currentPercentage}% Full
                                        </span>
                                        <span className="text-[8px] font-bold text-black/30 uppercase tracking-widest">Gym Capacity</span>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => syncGymData()}
                                disabled={isSyncingGym || justSynced}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3 rounded-2xl shadow-sm transition-all duration-300 border",
                                    isSyncingGym ? "bg-white border-black/5 cursor-not-allowed opacity-50" : 
                                    justSynced ? "bg-emerald-500 border-emerald-600 text-white" :
                                    "bg-white border-black/5 hover:bg-black/[0.02] group"
                                )}
                            >
                                {justSynced ? (
                                    <CheckCircle2 className="w-4 h-4 text-white animate-in zoom-in duration-300" />
                                ) : (
                                    <RefreshCw className={cn(
                                        "w-4 h-4 transition-transform duration-500",
                                        isSyncingGym ? "animate-spin text-black/40" : "text-black/40 group-hover:rotate-180"
                                    )} />
                                )}
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                                    justSynced ? "text-white" : "text-black"
                                )}>
                                    {isSyncingGym ? 'Syncing...' : justSynced ? 'Synced' : 'Sync'}
                                </span>
                            </button>
                        </div>
                    )}
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
