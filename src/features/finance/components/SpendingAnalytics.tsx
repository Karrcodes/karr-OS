'use client'

import { useMemo } from 'react'
import { PieChart, Wallet, ArrowDownRight, ArrowUpRight, ShoppingBag, Utensils, Home, Car, Zap, Heart, Layers } from 'lucide-react'
import type { Transaction } from '../types/finance.types'

interface SpendingAnalyticsProps {
    transactions: Transaction[]
}

const CATEGORY_ICONS: Record<string, any> = {
    'housing': Home,
    'food': Utensils,
    'transport': Car,
    'utilities': Zap,
    'shopping': ShoppingBag,
    'health': Heart,
    'entertainment': Layers,
    'other': Wallet
}

const CATEGORY_COLORS: Record<string, string> = {
    'housing': '#3b82f6',
    'food': '#f59e0b',
    'transport': '#10b981',
    'utilities': '#6366f1',
    'shopping': '#ec4899',
    'health': '#ef4444',
    'entertainment': '#8b5cf6',
    'other': '#64748b'
}

export function SpendingAnalytics({ transactions }: SpendingAnalyticsProps) {
    const stats = useMemo(() => {
        const spends = transactions.filter(t => t.type === 'spend')
        const totalSpend = spends.reduce((sum, t) => sum + t.amount, 0)

        const byCategory = spends.reduce((acc, t) => {
            const cat = t.category || 'other'
            acc[cat] = (acc[cat] || 0) + t.amount
            return acc
        }, {} as Record<string, number>)

        const sortedCategories = Object.entries(byCategory)
            .map(([name, amount]) => ({
                name,
                amount,
                percentage: (amount / totalSpend) * 100,
                icon: CATEGORY_ICONS[name] || Wallet,
                color: CATEGORY_COLORS[name] || '#64748b'
            }))
            .sort((a, b) => b.amount - a.amount)

        return { totalSpend, sortedCategories }
    }, [transactions])

    if (transactions.length === 0) return null

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Spend Card */}
                <div className="bg-white p-6 rounded-3xl border border-black/[0.06] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-black/30 uppercase tracking-widest mb-4">
                            <PieChart className="w-3.5 h-3.5" /> Total Spending Analytics
                        </div>
                        <div className="text-[32px] font-bold text-black flex items-baseline gap-1.5">
                            <span className="text-[20px] opacity-30">£</span>
                            {stats.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[12px] text-black/40 mt-1 font-medium italic">Across all synced accounts and manual entries.</p>
                    </div>

                    <div className="mt-8 space-y-3">
                        {stats.sortedCategories.slice(0, 3).map((cat, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <span className="text-[11px] font-bold text-black/60 capitalize">{cat.name}</span>
                                    <span className="text-[11px] font-bold text-black/30">£{cat.amount.toFixed(0)}</span>
                                </div>
                                <div className="h-1.5 bg-black/[0.03] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Categories Breakdown */}
                <div className="bg-white p-6 rounded-3xl border border-black/[0.06] shadow-sm">
                    <h3 className="text-[14px] font-bold text-black mb-4">Top Categories</h3>
                    <div className="space-y-2">
                        {stats.sortedCategories.map((cat, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-black/[0.04] hover:bg-black/[0.01] transition-colors group">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                                    style={{ backgroundColor: cat.color }}
                                >
                                    <cat.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[13px] font-bold text-black capitalize">{cat.name}</p>
                                    <p className="text-[10px] text-black/30 font-bold uppercase tracking-wider">{cat.percentage.toFixed(1)}% of total</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[14px] font-bold text-black">£{cat.amount.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
