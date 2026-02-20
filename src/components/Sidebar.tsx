'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
    BarChart3, CheckSquare, FolderKanban, Video,
    SlidersHorizontal, Menu, X, RefreshCw,
    Lock, BookOpen, Utensils, Dumbbell, Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    {
        label: 'Finances',
        href: '/finances',
        icon: BarChart3,
        sub: [{ label: 'Settings', href: '/finances/settings', icon: SlidersHorizontal }],
    },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare, disabled: true },
    { label: 'Projects', href: '/projects', icon: FolderKanban, disabled: true },
    { label: 'Content Studio', href: '/content', icon: Video, disabled: true },
    { label: 'Security Vault', href: '/vault', icon: Shield, disabled: true },
    { label: 'Journal', href: '/journal', icon: BookOpen, disabled: true },
    { label: 'Nutrition & Fuel', href: '/nutrition', icon: Utensils, disabled: true },
    { label: 'Training', href: '/fitness', icon: Dumbbell, disabled: true },
]

export function Sidebar() {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)

    // Close drawer on route change
    useEffect(() => { setMobileOpen(false) }, [pathname])

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
                                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150',
                                isActive ? 'bg-[#7c3aed]/10 text-[#7c3aed]' : 'text-black/50 hover:text-black/80 hover:bg-black/[0.04]'
                            )}
                        >
                            <Icon className={cn('w-4 h-4', isActive ? 'text-[#7c3aed]' : 'text-black/35')} />
                            <span className="text-[13px] font-medium">{item.label}</span>
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />}
                        </Link>

                        {'sub' in item && item.sub && isActive && (
                            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-black/[0.07] pl-3">
                                {item.sub.map((subItem) => {
                                    const SubIcon = subItem.icon
                                    const subActive = pathname === subItem.href
                                    return (
                                        <Link
                                            key={subItem.href}
                                            href={subItem.href}
                                            className={cn(
                                                'flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition-colors',
                                                subActive ? 'text-[#7c3aed] bg-[#7c3aed]/8' : 'text-black/35 hover:text-black/60'
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

    const footer = (
        <div className="px-5 py-4 border-t border-black/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center">
                    <span className="text-[11px] text-[#7c3aed] font-bold">K</span>
                </div>
                <div>
                    <p className="text-[12px] text-black/80 font-semibold">Karr</p>
                    <p className="text-[10px] text-black/35">Personal OS</p>
                </div>
            </div>
            <button
                onClick={() => window.location.reload()}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-black/35 hover:text-black/80 hover:bg-black/[0.05] transition-colors"
                title="Refresh App"
            >
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>
    )

    return (
        <>
            {/* ── Desktop sidebar (always visible ≥ md) ─────────────────── */}
            <aside className="hidden md:flex fixed left-0 top-0 h-full w-[220px] bg-white border-r border-black/[0.07] flex-col z-50 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
                <div className="px-5 pt-5 pb-4 border-b border-black/[0.06]">
                    <Image src="/karros-logo.png.jpeg" alt="KarrOS" width={160} height={40} priority className="h-8 w-auto" />
                </div>
                {nav}
                {footer}
            </aside>

            {/* ── Mobile top bar ─────────────────────────────────────────── */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-black/[0.07] flex items-center px-4 z-40">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/[0.05] transition-colors"
                >
                    <Menu className="w-5 h-5 text-black/60" />
                </button>
                <div className="flex-1 flex justify-center">
                    <Image src="/karros-logo.png.jpeg" alt="KarrOS" width={100} height={28} priority className="h-6 w-auto" />
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
                    <aside className="relative w-[260px] bg-white h-full flex flex-col shadow-2xl">
                        <div className="px-5 pt-5 pb-4 border-b border-black/[0.06] flex items-center justify-between">
                            <Image src="/karros-logo.png.jpeg" alt="KarrOS" width={100} height={28} priority className="h-6 w-auto" />
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/[0.05] transition-colors"
                            >
                                <X className="w-4 h-4 text-black/40" />
                            </button>
                        </div>
                        {nav}
                        {footer}
                    </aside>
                </div>
            )}

            {/* ── Mobile top-bar spacer (pushes content below the bar) ───── */}
            <div className="md:hidden h-14" />
        </>
    )
}
