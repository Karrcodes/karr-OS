'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
    BarChart3, CheckSquare,
    SlidersHorizontal, Menu, X, RefreshCw,
    Shield, ChevronDown, Check,
    TrendingUp, Calendar, CreditCard, PiggyBank,
    Moon, Sun, Laptop, Target, Briefcase, Heart, Gift
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

const navItems = [
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Goals', href: '/goals', icon: Target, disabled: true },
    { label: 'Career', href: '/career', icon: Briefcase, disabled: true },
    {
        label: 'Finances',
        href: '/finances',
        icon: BarChart3,
        sub: [
            { label: 'Projections', href: '/finances/projections', icon: Calendar },
            { label: 'Analytics', href: '/finances/analytics', icon: TrendingUp },
            { label: 'Liabilities', href: '/finances/liabilities', icon: CreditCard },
            { label: 'Savings', href: '/finances/savings', icon: PiggyBank },
            { label: 'Settings', href: '/finances/settings', icon: SlidersHorizontal }
        ],
    },
    { label: 'Health & Wellbeing', href: '/health', icon: Heart, disabled: true },
    { label: 'Security Vault', href: '/vault', icon: Shield, disabled: true },
    { label: 'Wishlist', href: '/wishlist', icon: Gift, disabled: true },
]

function ProfileMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    return (
        <div className="relative px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.06]" ref={menuRef}>
            {isOpen && (
                <div className="absolute bottom-full left-4 mb-2 w-52 bg-white dark:bg-[#0a0a0a] border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 z-[60]">
                    <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                        <p className="text-[12px] font-bold text-black dark:text-white">Karr OS Admin</p>
                        <p className="text-[10px] text-black/40 dark:text-white/40">karr@studiokarrtesian.com</p>
                    </div>
                    <div className="p-2">
                        <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black/30 dark:text-white/30">Theme</p>
                        <button
                            onClick={() => setTheme('light')}
                            className={cn("w-full flex items-center justify-between gap-2.5 px-3 py-2 text-[12px] rounded-lg transition-colors", theme === 'light' ? "bg-black/5 dark:bg-white dark:bg-[#0a0a0a]/10 text-black dark:text-white font-semibold" : "text-black/60 dark:text-white/60 hover:text-black dark:text-white dark:hover:text-white hover:bg-black/5 dark:hover:bg-white dark:bg-[#0a0a0a]/5")}
                        >
                            <div className="flex items-center gap-2.5"><Sun className="w-3.5 h-3.5" /> Light</div>
                            {theme === 'light' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={cn("w-full flex items-center justify-between gap-2.5 px-3 py-2 text-[12px] rounded-lg transition-colors", theme === 'dark' ? "bg-black/5 dark:bg-white dark:bg-[#0a0a0a]/10 text-black dark:text-white font-semibold" : "text-black/60 dark:text-white/60 hover:text-black dark:text-white dark:hover:text-white hover:bg-black/5 dark:hover:bg-white dark:bg-[#0a0a0a]/5")}
                        >
                            <div className="flex items-center gap-2.5"><Moon className="w-3.5 h-3.5" /> Dark</div>
                            {theme === 'dark' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={() => setTheme('system')}
                            className={cn("w-full flex items-center justify-between gap-2.5 px-3 py-2 text-[12px] rounded-lg transition-colors", theme === 'system' ? "bg-black/5 dark:bg-white dark:bg-[#0a0a0a]/10 text-black dark:text-white font-semibold" : "text-black/60 dark:text-white/60 hover:text-black dark:text-white dark:hover:text-white hover:bg-black/5 dark:hover:bg-white dark:bg-[#0a0a0a]/5")}
                        >
                            <div className="flex items-center gap-2.5"><Laptop className="w-3.5 h-3.5" /> System</div>
                            {theme === 'system' && <Check className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2.5 p-1 -ml-1 rounded-xl hover:bg-black/5 dark:hover:bg-white dark:bg-[#0a0a0a]/5 transition-colors text-left"
                >
                    <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white dark:bg-[#0a0a0a]/10 border border-black/20 dark:border-white/20 flex items-center justify-center shrink-0">
                        <span className="text-[12px] text-black dark:text-white font-bold">K</span>
                    </div>
                    <div>
                        <p className="text-[13px] text-black dark:text-white font-bold tracking-tight">Karr</p>
                        <p className="text-[11px] text-black/40 dark:text-white/40 font-medium">Personal OS</p>
                    </div>
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-black/35 dark:text-white/35 hover:text-black/80 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white dark:bg-[#0a0a0a]/10 transition-colors shrink-0"
                    title="Refresh App"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

export function Sidebar() {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
        '/finances': true // Open by default
    })

    // Close drawer on route change
    useEffect(() => { setMobileOpen(false) }, [pathname])

    const toggleFolder = (href: string, e: React.MouseEvent) => {
        e.preventDefault()
        setExpandedFolders(prev => ({ ...prev, [href]: !prev[href] }))
    }

    const nav = (
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <p className="text-[9px] tracking-[0.2em] text-black/25 uppercase font-semibold px-2 mb-3">Modules</p>
            {navItems.map((item) => {
                const isActive = !('disabled' in item && item.disabled) && pathname.startsWith(item.href)
                const Icon = item.icon

                if ('disabled' in item && item.disabled) {
                    return (
                        <div key={item.href} className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg cursor-not-allowed opacity-25">
                            <div className="flex items-center gap-2.5">
                                <Icon className="w-4 h-4 text-black/50" />
                                <span className="text-[13px] text-black/60 font-medium">{item.label}</span>
                            </div>
                            <span className="text-[9px] tracking-widest text-black/40 uppercase font-semibold bg-black/5 px-1.5 py-0.5 rounded">Soon</span>
                        </div>
                    )
                }

                return (
                    <div key={item.href}>
                        <Link
                            href={item.href}
                            className={cn(
                                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 relative group',
                                isActive ? 'bg-black/10 dark:bg-white dark:bg-[#0a0a0a]/10 text-black dark:text-white' : 'text-black/50 hover:text-black/80 hover:bg-black/[0.04] dark:bg-white/[0.04]'
                            )}
                        >
                            <Icon className={cn('w-4 h-4', isActive ? 'text-black dark:text-white' : 'text-black/35')} />
                            <span className="text-[13px] font-medium">{item.label}</span>

                            {'sub' in item && item.sub && (
                                <button
                                    type="button"
                                    onClick={(e) => toggleFolder(item.href, e)}
                                    className="ml-auto p-1 rounded hover:bg-black/5 text-black/40 hover:text-black/70 transition-colors"
                                >
                                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", expandedFolders[item.href] ? "rotate-180" : "")} />
                                </button>
                            )}
                        </Link>

                        {'sub' in item && item.sub && expandedFolders[item.href] && (
                            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-black/[0.07] dark:border-white/[0.07] pl-3">
                                {item.sub.map((subItem) => {
                                    const SubIcon = subItem.icon
                                    const subActive = pathname === subItem.href
                                    return (
                                        <Link
                                            key={subItem.href}
                                            href={subItem.href}
                                            className={cn(
                                                'flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition-colors',
                                                subActive ? 'text-black dark:text-white bg-black/8 dark:bg-white dark:bg-[#0a0a0a]/8' : 'text-black/35 hover:text-black/60'
                                            )}
                                        >
                                            <SubIcon className="w-3 h-3" />
                                            {subItem.label}
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            })}
        </nav>
    )

    return (
        <>
            {/* ── Desktop sidebar (always visible ≥ md) ─────────────────── */}
            <aside className="hidden md:flex fixed left-0 top-0 h-full w-[220px] bg-white dark:bg-[#0a0a0a] border-r border-black/[0.07] dark:border-white/[0.07] flex-col z-50 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
                <div className="px-5 pt-5 pb-4 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center h-[72px]">
                    <Image src="/karros-logo.png.jpeg" alt="KarrOS" width={160} height={40} priority className="h-10 w-auto object-contain" />
                </div>
                {nav}
                <ProfileMenu />
            </aside>

            {/* ── Mobile top bar ─────────────────────────────────────────── */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-[#0a0a0a] border-b border-black/[0.07] dark:border-white/[0.07] flex items-center px-4 z-40">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/[0.05] transition-colors"
                >
                    <Menu className="w-5 h-5 text-black/60" />
                </button>
                <div className="flex-1 flex justify-center items-center h-full">
                    <Image src="/karros-logo.png.jpeg" alt="KarrOS" width={120} height={32} priority className="h-7 w-auto object-contain" />
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/[0.05] transition-colors"
                    title="Refresh App"
                >
                    <RefreshCw className="w-5 h-5 text-black/60" />
                </button>
            </div>

            {/* ── Mobile drawer overlay ──────────────────────────────────── */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Drawer panel */}
                    <aside className="relative w-[260px] bg-white dark:bg-[#0a0a0a] h-full flex flex-col shadow-2xl">
                        <div className="px-5 pt-5 pb-4 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between h-[72px]">
                            <Image src="/karros-logo.png.jpeg" alt="KarrOS" width={120} height={32} priority className="h-7 w-auto object-contain" />
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/[0.05] transition-colors"
                            >
                                <X className="w-4 h-4 text-black/40" />
                            </button>
                        </div>
                        {nav}
                        <ProfileMenu />
                    </aside>
                </div>
            )}

            {/* ── Mobile top-bar spacer (pushes content below the bar) ───── */}
            <div className="md:hidden h-14" />
        </>
    )
}
