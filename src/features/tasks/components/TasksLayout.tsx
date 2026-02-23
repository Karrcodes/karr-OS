'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { KarrFooter } from '@/components/KarrFooter'
import { Activity, ShoppingCart, Bell, Calendar, Briefcase, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTasksProfile } from '../contexts/TasksProfileContext'

const TABS = [
    { title: 'Planner', href: '/tasks/planner', icon: Calendar, caps: ['P', 'B'] },
    { title: 'Deployment', href: '/tasks/todo', icon: Activity, caps: ['P', 'B'] },
    { title: 'Groceries', href: '/tasks/groceries', icon: ShoppingCart, caps: ['P'] },
    { title: 'Reminders', href: '/tasks/reminders', icon: Bell, caps: ['P', 'B'] },
]

function CapBadge({ cap }: { cap: 'P' | 'B' }) {
    return (
        <span className={cn(
            "w-3.5 h-3.5 flex items-center justify-center rounded-[2px] text-[8px] font-bold border shrink-0 select-none ml-1.5",
            cap === 'P'
                ? "bg-blue-50 text-blue-600 border-blue-200/50"
                : "bg-emerald-50 text-emerald-600 border-emerald-200/50"
        )}>
            {cap}
        </span>
    )
}

export function TasksLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { activeProfile, setActiveProfile } = useTasksProfile()

    return (
        <div className="flex flex-col h-full bg-[#fafafa]">
            <div className="flex flex-col px-6 pt-5 pb-0 border-b border-black/[0.06] bg-white flex-shrink-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[22px] font-bold text-black tracking-tight">Focus & Execution</h1>
                        <p className="text-[12px] text-black/40 mt-0.5">Manage core operations, groceries, and reminders sync'd across your devices.</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Profile Toggle in Header */}
                        <div className="flex bg-black/[0.04] p-0.5 rounded-lg shrink-0 border border-black/[0.04]">
                            <button
                                onClick={() => setActiveProfile('personal')}
                                className={cn(
                                    "p-1.5 px-2.5 sm:px-3 rounded-md flex items-center justify-center transition-all",
                                    activeProfile === 'personal'
                                        ? "bg-white text-black shadow-sm font-bold"
                                        : "text-black/40 hover:text-black/60 font-medium"
                                )}
                                aria-label="Personal Profile"
                            >
                                <User className="w-3.5 h-3.5 sm:hidden" />
                                <span className="hidden sm:inline text-[11px]">Personal</span>
                            </button>
                            <button
                                onClick={() => setActiveProfile('business')}
                                className={cn(
                                    "p-1.5 px-2.5 sm:px-3 rounded-md flex items-center justify-center transition-all",
                                    activeProfile === 'business'
                                        ? "bg-white text-black shadow-sm font-bold"
                                        : "text-black/40 hover:text-black/60 font-medium"
                                )}
                                aria-label="Business Profile"
                            >
                                <Briefcase className="w-3.5 h-3.5 sm:hidden" />
                                <span className="hidden sm:inline text-[11px]">Business</span>
                            </button>
                        </div>
                        <div className="w-px h-5 bg-black/[0.08]" />
                        <Link
                            href="/tasks/calendar"
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-bold transition-all border",
                                pathname === '/tasks/calendar'
                                    ? "bg-black text-white border-black"
                                    : "bg-white text-black/60 border-black/[0.08] hover:border-black/20"
                            )}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Calendar</span>
                        </Link>
                    </div>
                </div>

                {/* Mobile/Tablet Tabs */}
                <div className="flex items-center gap-4 mt-6 overflow-x-auto no-scrollbar pb-1">

                    {TABS.filter(tab => !(activeProfile === 'business' && tab.href.includes('groceries'))).map(tab => {
                        const isActive = pathname === tab.href
                        const Icon = tab.icon
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "flex items-center gap-2 pb-2 border-b-2 transition-colors whitespace-nowrap",
                                    isActive
                                        ? "border-black text-black font-bold"
                                        : "border-transparent text-black/40 hover:text-black/70 font-medium"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-[13px] flex items-center">{tab.title}
                                    {tab.caps.map(c => <CapBadge key={c} cap={c as 'P' | 'B'} />)}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-32 flex flex-col">
                <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col mb-8">
                    {children}
                </div>
                <div className="mt-auto w-full">
                    <KarrFooter />
                </div>
            </div>
        </div>
    )
}
