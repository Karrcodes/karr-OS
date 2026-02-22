'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { KarrFooter } from '@/components/KarrFooter'
import { CheckSquare, ShoppingCart, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
    { title: 'Action Items', href: '/tasks/todo', icon: CheckSquare },
    { title: 'Groceries', href: '/tasks/groceries', icon: ShoppingCart },
    { title: 'Reminders', href: '/tasks/reminders', icon: Bell },
]

export function TasksLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full bg-[#fafafa]">
            <div className="flex flex-col px-6 pt-5 pb-0 border-b border-black/[0.06] bg-white flex-shrink-0 z-10">
                <div>
                    <h1 className="text-[22px] font-bold text-black tracking-tight">Focus & Execution</h1>
                    <p className="text-[12px] text-black/40 mt-0.5">Manage tasks, groceries, and reminders sync'd across your devices.</p>
                </div>

                {/* Mobile/Tablet Tabs */}
                <div className="flex items-center gap-6 mt-6 overflow-x-auto no-scrollbar">
                    {TABS.map(tab => {
                        const isActive = pathname === tab.href
                        const Icon = tab.icon
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap",
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

            <div className="flex-1 overflow-y-auto p-6 pb-32 flex flex-col">
                <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                    {children}
                </div>
                <KarrFooter />
            </div>
        </div>
    )
}
