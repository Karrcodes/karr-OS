'use client'

import { useSettings } from '../hooks/useSettings'
import { InfoTooltip } from './InfoTooltip'
import { Activity, ArrowRightLeft } from 'lucide-react'

export function ExpectedCashflowCard({ monthlyObligations }: { monthlyObligations: number }) {
    const { settings, loading } = useSettings()

    if (loading) {
        return (
            <div className="rounded-xl border border-black/[0.07] bg-white p-5 animate-pulse flex items-center justify-center min-h-[140px]">
                <Activity className="w-5 h-5 text-black/20" />
            </div>
        )
    }

    const weeklyBase = parseFloat(settings['weekly_income_baseline'] || '0')
    const monthlyStructuralIncome = (weeklyBase * 52) / 12
    const expectedRemaining = Math.max(0, monthlyStructuralIncome - monthlyObligations)

    return (
        <div className="rounded-xl border border-black/[0.07] bg-white p-5 shadow-sm mt-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-[15px] font-bold text-black flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-orange-500" />
                        Expected Cashflow
                    </h2>
                    <p className="text-[12px] text-black/35 mt-0.5">
                        Structural Monthly Power
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center bg-black/[0.02] p-2.5 rounded-lg border border-black/[0.04]">
                    <span className="text-[12px] font-medium text-black/60">Base Income</span>
                    <span className="text-[13px] font-bold text-[#059669]">£{monthlyStructuralIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center bg-black/[0.02] p-2.5 rounded-lg border border-black/[0.04]">
                    <span className="text-[12px] font-medium text-black/60">Fixed Obligations</span>
                    <span className="text-[13px] font-bold text-[#dc2626]">-£{monthlyObligations.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-black/[0.06] flex items-end justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black/40">
                        Est. Remaining
                        <InfoTooltip content={'Your assumed weekly income baseline converted to a monthly figure ((Weekly * 52) / 12), minus your tracked monthly debt and subscription obligations.'} side="right" />
                    </div>
                    <span className="text-[22px] font-bold text-black tracking-tight">£{expectedRemaining.toFixed(2)}</span>
                </div>
            </div>
        </div>
    )
}
