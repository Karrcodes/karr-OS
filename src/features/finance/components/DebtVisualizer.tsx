'use client'

import { AlertTriangle, CreditCard } from 'lucide-react'
import type { Debt } from '../types/finance.types'

interface DebtVisualizerProps {
    debts: Debt[]
}

function ProgressBar({ value, max }: { value: number; max: number }) {
    const paid = max - value
    const pct = max > 0 ? Math.min((paid / max) * 100, 100) : 0
    const dangerPct = max > 0 ? (value / max) * 100 : 0

    return (
        <div className="space-y-1">
            <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: dangerPct > 75 ? '#ef4444' : dangerPct > 40 ? '#f59e0b' : '#059669',
                    }}
                />
            </div>
            <div className="flex justify-between">
                <span className="text-[10px] text-black/30">{pct.toFixed(0)}% paid off</span>
                <span className="text-[10px] text-black/30">£{value.toFixed(2)} remaining</span>
            </div>
        </div>
    )
}

export function DebtVisualizer({ debts }: DebtVisualizerProps) {
    const totalMonthly = debts.reduce((sum, d) => sum + d.monthly_payment, 0)
    const totalRemaining = debts.reduce((sum, d) => sum + d.remaining_balance, 0)
    const shortTerm = debts.filter((d) => d.type === 'Short-Term')
    const longTerm = debts.filter((d) => d.type === 'Long-Term')

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="text-[10px] text-red-500/70 uppercase tracking-wider font-semibold mb-1">Total Remaining</p>
                    <p className="text-2xl font-bold text-red-600">£{totalRemaining.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-[10px] text-amber-600/70 uppercase tracking-wider font-semibold mb-1">Monthly Fixed Cost</p>
                    <p className="text-2xl font-bold text-amber-600">£{totalMonthly.toFixed(2)}</p>
                    <p className="text-[10px] text-amber-600/50 mt-0.5">across {debts.length} agreements</p>
                </div>
            </div>

            {debts.length === 0 && (
                <div className="rounded-xl border border-black/[0.07] bg-black/[0.02] p-6 text-center">
                    <p className="text-black/30 text-sm">No active debts — great position!</p>
                </div>
            )}

            {shortTerm.length > 0 && (
                <div>
                    <p className="text-[10px] text-black/35 uppercase tracking-wider font-semibold mb-2 px-1">Short-Term</p>
                    <div className="space-y-2">{shortTerm.map((debt) => <DebtCard key={debt.id} debt={debt} />)}</div>
                </div>
            )}

            {longTerm.length > 0 && (
                <div>
                    <p className="text-[10px] text-black/35 uppercase tracking-wider font-semibold mb-2 px-1">Long-Term</p>
                    <div className="space-y-2">{longTerm.map((debt) => <DebtCard key={debt.id} debt={debt} />)}</div>
                </div>
            )}
        </div>
    )
}

function DebtCard({ debt }: { debt: Debt }) {
    const paid = debt.total_amount - debt.remaining_balance
    const isHighRisk = debt.remaining_balance / debt.total_amount > 0.75

    return (
        <div className="rounded-xl border border-black/[0.07] bg-white p-4 hover:bg-black/[0.01] transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-black/[0.04] flex items-center justify-center">
                        {isHighRisk
                            ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            : <CreditCard className="w-3.5 h-3.5 text-black/35" />
                        }
                    </div>
                    <div>
                        <p className="text-[13px] font-semibold text-black/90">{debt.name}</p>
                        <p className="text-[10px] text-black/35">
                            Due: {debt.due_date_of_month ? `${debt.due_date_of_month}th of month` : 'Not set'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[12px] font-semibold text-amber-600">£{debt.monthly_payment.toFixed(2)}/mo</p>
                    <p className="text-[10px] text-black/35">£{paid.toFixed(2)} paid</p>
                </div>
            </div>
            <ProgressBar value={debt.remaining_balance} max={debt.total_amount} />
        </div>
    )
}
