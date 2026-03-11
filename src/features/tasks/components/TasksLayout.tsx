'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { KarrFooter } from '@/components/KarrFooter'
import { Activity, ShoppingCart, Bell, Calendar, Briefcase, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTasksProfile } from '../contexts/TasksProfileContext'

const TABS = [
    { title: 'Deployment', href: '/tasks/todo', icon: Activity },
    { title: 'Reminders', href: '/tasks/reminders', icon: Bell },
    { title: 'Groceries', href: '/tasks/groceries', icon: ShoppingCart },
]

function ProfileToggle({ activeProfile, setActiveProfile }: { activeProfile: string, setActiveProfile: (p: 'personal' | 'business') => void }) {
    return (
        <div className="flex bg-black/[0.04] p-0.5 rounded-xl border border-black/[0.06] items-center w-fit">
            <button
                onClick={() => setActiveProfile('personal')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeProfile === 'personal' ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black/60'}`}
            >
                Personal
            </button>
            <button
                onClick={() => setActiveProfile('business')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeProfile === 'business' ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black/60'}`}
            >
                Business
            </button>
        </div>
    )
}

export function TasksLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { activeProfile, setActiveProfile } = useTasksProfile()

    const isOnCalendar = pathname === '/tasks/calendar'
    const isPlanner = pathname === '/tasks/planner'
    const isMatrix = pathname === '/tasks/matrix'
    const isGroceries = pathname === '/tasks/groceries'
    const isSpecialView = isOnCalendar || isPlanner || isMatrix

    return (
        <div className="flex flex-col min-h-screen bg-[#fafafa]">
            <div className="flex flex-col md:flex-row md:items-end justify-between px-6 py-8 md:px-10 md:py-10 bg-white z-10 gap-6">
                <div className="space-y-1">
                    <h2 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em]">Operations Protocol</h2>
                    <h1 className="text-4xl font-black text-black tracking-tighter uppercase">Focus & Execution</h1>
                    {!isOnCalendar && !isPlanner && !isGroceries && (
                        <div className="pt-2">
                            <ProfileToggle activeProfile={activeProfile} setActiveProfile={setActiveProfile} />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 mb-1">
                    {/* Planner: go to ops page if currently on planner, otherwise navigate to planner */}
                    {isPlanner ? (
                        <button
                            onClick={() => router.push('/tasks/todo')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all border bg-black text-white border-black shadow-lg shadow-black/10 hover:scale-105 active:scale-95"
                        >
                            <Activity className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Planner</span>
                        </button>
                    ) : (
                        <Link
                            href="/tasks/planner"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all border bg-white text-black/60 border-black/[0.1] hover:border-black/20 hover:bg-black/[0.02] active:scale-95"
                        >
                            <Activity className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Planner</span>
                        </Link>
                    )}
                    {/* Matrix */}
                    {isMatrix ? (
                        <button
                            onClick={() => router.push('/tasks/todo')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all border bg-black text-white border-black shadow-lg shadow-black/10 hover:scale-105 active:scale-95"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            <span className="hidden sm:inline">Matrix</span>
                        </button>
                    ) : (
                        <Link
                            href="/tasks/matrix"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all border bg-white text-black/60 border-black/[0.1] hover:border-black/20 hover:bg-black/[0.02] active:scale-95"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            <span className="hidden sm:inline">Matrix</span>
                        </Link>
                    )}
                    {/* Calendar: go to ops page if currently on calendar, otherwise navigate to calendar */}
                    {isOnCalendar ? (
                        <button
                            onClick={() => router.push('/tasks/todo')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all border bg-black text-white border-black shadow-lg shadow-black/10 hover:scale-105 active:scale-95"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Calendar</span>
                        </button>
                    ) : (
                        <Link
                            href="/tasks/calendar"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all border bg-white text-black/60 border-black/[0.1] hover:border-black/20 hover:bg-black/[0.02] active:scale-95"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Calendar</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Tabs — hidden on special view pages */}
            {!isSpecialView && (
                <div className="px-6 bg-white border-b border-black/[0.06] flex-shrink-0">
                    <div className="flex items-center gap-5 overflow-x-auto no-scrollbar pb-px">
                        {TABS.filter(tab => !(activeProfile === 'business' && tab.href.includes('groceries'))).map(tab => {
                            const isActive = pathname === tab.href
                            const Icon = tab.icon
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={cn(
                                        "flex items-center gap-2 py-3 border-b-2 transition-colors whitespace-nowrap",
                                        isActive
                                            ? "border-black text-black font-bold"
                                            : "border-transparent text-black/40 hover:text-black/70 font-medium"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-[13px]">{tab.title}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Main content — flexible container */}
            <div className={cn("flex flex-col min-h-0 overflow-y-auto w-full", !isMatrix && "flex-1")}>
                <div className={cn("flex flex-col w-full", isMatrix ? "p-6 pb-0" : "p-6 flex-1")}>
                    <div className={cn("mx-auto w-full", isSpecialView ? "max-w-7xl" : "max-w-5xl flex-1 flex flex-col")}>
                        {children}
                    </div>
                </div>
                <KarrFooter />
            </div>
        </div>
    )
}
