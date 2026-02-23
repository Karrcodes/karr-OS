'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { KarrFooter } from '@/components/KarrFooter'
import { Activity, ShoppingCart, Bell, Calendar, Briefcase, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTasksProfile } from '../contexts/TasksProfileContext'

const TABS = [
    { title: 'Deployment', href: '/tasks/todo', icon: Activity },
    { title: 'Groceries', href: '/tasks/groceries', icon: ShoppingCart },
    { title: 'Reminders', href: '/tasks/reminders', icon: Bell },
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

    const calendarHref = pathname === '/tasks/calendar' ? '/tasks/todo' : '/tasks/calendar'
    const isOnCalendar = pathname === '/tasks/calendar'
    const isPlanner = pathname === '/tasks/planner'

    return (
        <div className="flex flex-col h-full bg-[#fafafa]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-5 border-b border-black/[0.06] bg-white flex-shrink-0 z-10 gap-3 lg:gap-0">
                <div>
                    <h1 className="text-[22px] font-bold text-black tracking-tight">Focus &amp; Execution</h1>
                    <p className="text-[12px] text-black/35 mt-0.5">Operations Module · {activeProfile === 'personal' ? 'Personal' : 'Business'}</p>
                </div>
                {!isPlanner && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        {/* Toggle: visible below title on mobile/sm, moves right on lg */}
                        <div className="order-2 sm:order-1">
                            <ProfileToggle activeProfile={activeProfile} setActiveProfile={setActiveProfile} />
                        </div>
                        {/* Calendar button */}
                        <div className="order-1 sm:order-2 flex items-center">
                            <Link
                                href={calendarHref}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all border",
                                    isOnCalendar
                                        ? "bg-black text-white border-black"
                                        : "bg-white text-black/60 border-black/[0.08] hover:border-black/20"
                                )}
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{isOnCalendar ? '← Back' : 'Calendar'}</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs — hidden on Planner + Calendar pages */}
            {!isPlanner && !isOnCalendar && (
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

            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
                <div className="p-6 flex-1 flex flex-col">
                    <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                        {children}
                    </div>
                </div>
                <div className="mt-auto">
                    <KarrFooter />
                </div>
            </div>
        </div>
    )
}
