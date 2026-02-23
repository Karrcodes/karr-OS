'use client'

import { usePathname } from 'next/navigation'
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

export function TasksLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { activeProfile, setActiveProfile } = useTasksProfile()

    return (
        <div className="flex flex-col h-full bg-[#fafafa]">
            <div className="flex flex-col px-4 sm:px-6 pt-4 sm:pt-5 pb-0 border-b border-black/[0.06] bg-white flex-shrink-0 z-10">
                {/* Header Row: title on left, controls on right */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-[20px] sm:text-[22px] font-bold text-black tracking-tight leading-tight">Focus &amp; Execution</h1>
                        <p className="text-[11px] sm:text-[12px] text-black/40 mt-0.5 leading-snug">Operations, groceries &amp; reminders.</p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-0.5">
                        {/* Profile Toggle */}
                        <div className="flex bg-black/[0.04] p-0.5 rounded-lg border border-black/[0.04]">
                            <button
                                onClick={() => setActiveProfile('personal')}
                                className={cn(
                                    "p-1.5 px-2 sm:px-2.5 rounded-md flex items-center justify-center transition-all",
                                    activeProfile === 'personal'
                                        ? "bg-white text-black shadow-sm font-bold"
                                        : "text-black/40 hover:text-black/60"
                                )}
                                aria-label="Personal Profile"
                            >
                                <User className="w-3.5 h-3.5 sm:hidden" />
                                <span className="hidden sm:inline text-[11px] font-semibold">Personal</span>
                            </button>
                            <button
                                onClick={() => setActiveProfile('business')}
                                className={cn(
                                    "p-1.5 px-2 sm:px-2.5 rounded-md flex items-center justify-center transition-all",
                                    activeProfile === 'business'
                                        ? "bg-white text-black shadow-sm font-bold"
                                        : "text-black/40 hover:text-black/60"
                                )}
                                aria-label="Business Profile"
                            >
                                <Briefcase className="w-3.5 h-3.5 sm:hidden" />
                                <span className="hidden sm:inline text-[11px] font-semibold">Business</span>
                            </button>
                        </div>
                        <div className="w-px h-4 bg-black/[0.08]" />
                        <Link
                            href="/tasks/calendar"
                            className={cn(
                                "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-bold transition-all border",
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

                {/* Tabs — hidden on Planner page */}
                {pathname !== '/tasks/planner' && (
                    <div className="flex items-center gap-5 mt-5 overflow-x-auto no-scrollbar pb-px">
                        {TABS.filter(tab => !(activeProfile === 'business' && tab.href.includes('groceries'))).map(tab => {
                            const isActive = pathname === tab.href
                            const Icon = tab.icon
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={cn(
                                        "flex items-center gap-2 pb-2.5 border-b-2 transition-colors whitespace-nowrap",
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
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
                <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                    {children}
                </div>
                <KarrFooter />
            </div>
        </div>
    )
}
