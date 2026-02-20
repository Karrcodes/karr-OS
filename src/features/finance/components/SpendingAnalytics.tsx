'use client'

import { useMemo, useState } from 'react'
import { PieChart, Wallet, ArrowDownLeft, ArrowUpRight, ShoppingBag, Utensils, Home, Car, Zap, Heart, Layers, ArrowLeft, X } from 'lucide-react'
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
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const stats = useMemo(() => {
        const spends = transactions.filter(t => t.type === 'spend')
        const totalSpend = spends.reduce((sum, t) => sum + t.amount, 0)

        const byCategory = spends.reduce((acc, t) => {
            const cat = t.category || 'other'
            if (!acc[cat]) acc[cat] = { total: 0, transactions: [] }
            acc[cat].total += t.amount
            acc[cat].transactions.push(t)
            return acc
        }, {} as Record<string, { total: number; transactions: Transaction[] }>)

        const sortedCategories = Object.entries(byCategory)
            .map(([name, data]) => ({
                name,
                amount: data.total,
                transactions: data.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                percentage: totalSpend > 0 ? (data.total / totalSpend) * 100 : 0,
                icon: CATEGORY_ICONS[name] || Wallet,
                color: CATEGORY_COLORS[name] || '#64748b'
            }))
            .sort((a, b) => b.amount - a.amount)

        return { totalSpend, sortedCategories }
    }, [transactions])

    if (transactions.length === 0) {
        return (
            <div className="py-20 text-center bg-white rounded-3xl border border-black/[0.05] shadow-sm">
                <div className="w-16 h-16 bg-black/[0.03] rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <PieChart className="w-8 h-8 text-black/20" />
                </div>
                <h3 className="text-[16px] font-bold text-black">No Transactions Yet</h3>
                <p className="text-[13px] text-black/40 mt-1 max-w-xs mx-auto">Sync your bank or log transactions to see your spending breakdown here.</p>
            </div>
        )
    }

    // Drill-down view for a selected category
    if (selectedCategory) {
        const category = stats.sortedCategories.find(c => c.name === selectedCategory)
        if (!category) return null
        const Icon = category.icon

        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 text-[13px] font-bold text-black/50 hover:text-black transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Overview
                </button>

                {/* Category Header */}
                <div className="bg-white p-6 rounded-3xl border border-black/[0.06] shadow-sm">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: category.color }}
                        >
                            <Icon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-[20px] font-bold text-black capitalize">{category.name}</h2>
                            <p className="text-[12px] text-black/40 font-medium">{category.transactions.length} transactions · {category.percentage.toFixed(1)}% of total spending</p>
                        </div>
                        <div className="ml-auto text-right">
                            <div className="text-[28px] font-bold text-black flex items-baseline gap-1">
                                <span className="text-[20px] opacity-30">£</span>
                                {category.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[11px] text-black/30 font-medium">Total spent</p>
                        </div>
                    </div>
                </div>

                {/* Transaction List */}
                <div className="bg-white rounded-3xl border border-black/[0.06] shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-black/[0.04] bg-black/[0.01]">
                        <h3 className="text-[13px] font-bold text-black">All Transactions</h3>
                    </div>
                    <div className="divide-y divide-black/[0.04]">
                        {category.transactions.map((t) => (
                            <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-black/[0.01] transition-colors">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-black/[0.02] border border-black/[0.04]">
                                    {t.emoji || '💸'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-black truncate">{t.description || 'Transaction'}</p>
                                    <p className="text-[11px] text-black/30 font-medium">
                                        {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <p className="text-[14px] font-bold text-black">
                                    -£{t.amount.toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // Overview
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
                        <p className="text-[12px] text-black/40 mt-1 font-medium italic">Across {transactions.filter(t => t.type === 'spend').length} recorded spends.</p>
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

                {/* Categories Grid - Clickable */}
                <div className="bg-white p-6 rounded-3xl border border-black/[0.06] shadow-sm">
                    <h3 className="text-[14px] font-bold text-black mb-1">Top Categories</h3>
                    <p className="text-[11px] text-black/30 mb-4">Tap a category to see its transactions</p>
                    <div className="space-y-2">
                        {stats.sortedCategories.map((cat, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedCategory(cat.name)}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-black/[0.04] hover:bg-black/[0.02] hover:border-black/[0.08] transition-all group text-left"
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform"
                                    style={{ backgroundColor: cat.color }}
                                >
                                    <cat.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-black capitalize">{cat.name}</p>
                                    <p className="text-[10px] text-black/30 font-bold uppercase tracking-wider">{cat.percentage.toFixed(1)}% · {cat.transactions.length} tx</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[14px] font-bold text-black">£{cat.amount.toFixed(2)}</p>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-black/20 ml-auto mt-0.5 group-hover:text-[#7c3aed] transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
