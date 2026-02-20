'use client'

import { useState } from 'react'
import { Plus, Check, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Pocket, Goal } from '../types/finance.types'
import { useIncome } from '../hooks/useIncome'

interface PaydayAllocationProps {
    pockets: Pocket[]
    goals: Goal[]
    onSuccess: () => void
}

export function PaydayAllocation({ pockets, goals, onSuccess }: PaydayAllocationProps) {
    const { logIncome } = useIncome()
    const [amount, setAmount] = useState('')
    const [source, setSource] = useState('Salary')

    // State for allocation step
    const [allocating, setAllocating] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // A map of pocket_id -> amount to allocate
    const [allocations, setAllocations] = useState<{ [key: string]: number }>({})

    // Populate default allocations based on target_budget of each pocket
    const startAllocation = () => {
        const amt = parseFloat(amount)
        if (!amt || amt <= 0) {
            setError('Please enter a valid income amount.')
            return
        }
        setError(null)

        const defaultAllocations: { [key: string]: number } = {}
        pockets.forEach(p => {
            defaultAllocations[p.id] = p.target_budget // Prefill with the expected weekly allocation
        })
        setAllocations(defaultAllocations)
        setAllocating(true)
    }

    const unallocated = parseFloat(amount || '0') - Object.values(allocations).reduce((sum, curr) => sum + (curr || 0), 0)

    const handleConfirm = async () => {
        if (unallocated < 0) {
            setError('You have allocated more than your income.')
            return
        }
        setLoading(true)
        setError(null)

        try {
            // 1. Log Income
            const amt = parseFloat(amount)
            await logIncome({
                amount: amt,
                source: source,
                date: new Date().toISOString().split('T')[0]
            })

            // 2. Process Allocations
            const transactionPromises: any[] = []
            const pocketUpdatePromises: any[] = []

            for (const [pocketId, allocAmt] of Object.entries(allocations)) {
                if (allocAmt > 0) {
                    const pocket = pockets.find(p => p.id === pocketId)
                    if (pocket) {
                        transactionPromises.push(
                            supabase.from('fin_transactions').insert({
                                type: 'allocate',
                                amount: allocAmt,
                                pocket_id: pocketId,
                                description: `Payday allocation (${source})`,
                                date: new Date().toISOString().split('T')[0]
                            }).then(res => res)
                        )
                        pocketUpdatePromises.push(
                            supabase.from('fin_pockets').update({
                                balance: pocket.balance + allocAmt
                            }).eq('id', pocketId).then(res => res)
                        )
                    }
                }
            }

            await Promise.all([...transactionPromises, ...pocketUpdatePromises])

            // Reset state
            setAmount('')
            setAllocations({})
            setAllocating(false)
            onSuccess()

        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to save allocations.')
        } finally {
            setLoading(false)
        }
    }

    if (allocating) {
        return (
            <div className="rounded-2xl border border-[#059669]/30 bg-[#059669]/5 p-5 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-[16px] font-bold text-[#059669]">Distribute Income</h2>
                        <p className="text-[12px] text-black/60 mt-0.5">Allocate your £{parseFloat(amount).toFixed(2)} {source}</p>
                    </div>
                    <div className={`text-right ${unallocated < 0 ? 'text-red-600' : unallocated === 0 ? 'text-[#059669]' : 'text-black'}`}>
                        <div className="text-[20px] font-bold">£{unallocated.toFixed(2)}</div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60">To Assign</div>
                    </div>
                </div>

                <div className="space-y-2 mb-5">
                    {pockets.map(p => (
                        <div key={p.id} className="flex items-center gap-3 bg-white border border-black/[0.06] rounded-xl p-3">
                            <div className="flex-1">
                                <div className="text-[13px] font-semibold text-black/80">{p.name}</div>
                                <div className="text-[11px] text-black/40">Current: £{p.balance.toFixed(2)} • Target: £{p.target_budget.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[14px] font-bold text-black/40">+£</span>
                                <input
                                    type="number"
                                    value={allocations[p.id] ?? ''}
                                    onChange={(e) => setAllocations(prev => ({ ...prev, [p.id]: parseFloat(e.target.value) || 0 }))}
                                    className="w-24 bg-black/[0.04] border border-black/[0.08] rounded-lg px-3 py-1.5 text-[14px] font-bold text-black text-right outline-none focus:border-[#059669]/40"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {error && <p className="text-[12px] text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mb-4">{error}</p>}

                <div className="flex gap-3">
                    <button
                        onClick={handleConfirm}
                        disabled={loading || unallocated < 0}
                        className="flex-1 py-3 rounded-xl bg-[#059669] text-white font-bold text-[14px] hover:bg-[#047857] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Confirm Allocations</>}
                    </button>
                    <button
                        onClick={() => setAllocating(false)}
                        disabled={loading}
                        className="py-3 px-6 rounded-xl border border-black/[0.1] text-black/60 font-semibold text-[14px] hover:bg-black/[0.05] transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">Log new income</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 font-bold text-lg">£</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-black placeholder-black/20 outline-none focus:border-[#7c3aed]/40 transition-colors"
                        />
                    </div>
                    <input
                        type="text"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="Source (e.g. Salary)"
                        className="w-1/3 bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-3 text-[14px] text-black placeholder-black/20 outline-none focus:border-[#7c3aed]/40 transition-colors"
                    />
                </div>
                {error && <p className="text-[12px] text-red-600 mt-2">{error}</p>}
            </div>
            <button
                onClick={startAllocation}
                className="py-3 px-6 rounded-xl bg-black text-white font-semibold text-[14px] hover:bg-black/80 transition-colors whitespace-nowrap"
            >
                Assign Money
            </button>
        </div>
    )
}
