'use client'

import { Wallet, TrendingDown, Coins } from 'lucide-react'
import type { Pocket } from '../types/finance.types'

interface PocketsGridProps {
    pockets: Pocket[]
}

function ProgressBar({ value, max, color = '#7c3aed' }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    const isOver = max > 0 && value > max

    return (
        <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: isOver ? '#ef4444' : color }}
            />
        </div>
    )
}

const typeConfig = {
    buffer: { label: 'Buffer', color: '#059669', icon: Wallet },
    savings: { label: 'Savings', color: '#2563eb', icon: Coins },
    general: { label: 'Pocket', color: '#000000', icon: TrendingDown },
}

export function PocketsGrid({ pockets }: PocketsGridProps) {
    if (pockets.length === 0) {
        return (
            <div className="rounded-xl border border-black/[0.07] bg-black/[0.02] p-6 text-center">
                <p className="text-black/30 text-sm">No pockets yet — create one in Settings.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {pockets.map((pocket) => {
                const config = typeConfig[pocket.type] ?? typeConfig.general
                const Icon = config.icon
                const pct = pocket.target_budget > 0
                    ? Math.min((pocket.balance / pocket.target_budget) * 100, 100)
                    : 0
                const isOver = pocket.balance > pocket.target_budget && pocket.target_budget > 0

                return (
                    <div
                        key={pocket.id}
                        className="group relative rounded-xl border border-black/[0.07] bg-white p-4 hover:bg-black/[0.01] hover:border-black/[0.12] transition-all duration-200 shadow-sm"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${config.color}12` }}
                                >
                                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-black/90 leading-tight">{pocket.name}</p>
                                    <p className="text-[10px] text-black/35 uppercase tracking-wider">{config.label}</p>
                                </div>
                            </div>
                            {isOver && (
                                <span className="text-[9px] uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-semibold border border-red-100">
                                    Over
                                </span>
                            )}
                        </div>

                        <div className="mb-3">
                            <p className="text-2xl font-bold text-black tracking-tight privacy-blur">
                                £{(pocket.balance ?? 0).toFixed(2)}
                            </p>
                            {pocket.target_budget > 0 && (
                                <p className="text-[11px] text-black/35 mt-0.5">
                                    remaining of <span className="privacy-blur">£{pocket.target_budget.toFixed(2)}</span> alloc
                                </p>
                            )}
                        </div>

                        {pocket.target_budget > 0 && (
                            <>
                                <ProgressBar value={(pocket.balance ?? 0)} max={pocket.target_budget} color={config.color} />
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-[10px] text-black/40">{pct.toFixed(0)}% available</span>
                                    <span className="text-[10px] text-black/40">
                                        <span className="privacy-blur">£{Math.max(0, pocket.target_budget - (pocket.balance ?? 0)).toFixed(2)}</span> spent
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
