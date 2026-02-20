'use client'

import { useState } from 'react'
import { Plus, X, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Pocket } from '../types/finance.types'

interface QuickActionFABProps {
    pockets: Pocket[]
    onSuccess: () => void
}

type Tab = 'income' | 'spend' | 'transfer'

export function QuickActionFAB({ pockets, onSuccess }: QuickActionFABProps) {
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<Tab>('income')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [amount, setAmount] = useState('')
    const [selectedPocket, setSelectedPocket] = useState('')
    const [toPocket, setToPocket] = useState('')
    const [description, setDescription] = useState('')

    const reset = () => { setAmount(''); setSelectedPocket(''); setToPocket(''); setDescription(''); setError(null) }
    const handleClose = () => { setOpen(false); reset() }
    const handleTabChange = (tab: Tab) => { setActiveTab(tab); reset() }

    const handleSubmit = async () => {
        const amt = parseFloat(amount)
        if (!amt || amt <= 0) { setError('Enter a valid amount.'); return }
        setLoading(true); setError(null)

        try {
            if (activeTab === 'income') {
                if (!description) { setError('Enter an income source.'); setLoading(false); return }
                // Log to fin_income (enters the "To Assign" pool logically)
                await supabase.from('fin_income').insert({
                    amount: amt,
                    source: description,
                    date: new Date().toISOString().split('T')[0]
                })
            }
            if (activeTab === 'spend') {
                if (!selectedPocket) { setError('Select a pocket.'); setLoading(false); return }
                const pocket = pockets.find((p) => p.id === selectedPocket)
                // We use standard balance now
                if (pocket && amt > pocket.balance) { setError(`Insufficient balance in ${pocket.name}. Available: £${pocket.balance.toFixed(2)}`); setLoading(false); return }

                await supabase.from('fin_transactions').insert({
                    type: 'spend',
                    amount: amt,
                    pocket_id: selectedPocket,
                    description: description || 'Expense',
                    date: new Date().toISOString().split('T')[0]
                })
                if (pocket) await supabase.from('fin_pockets').update({ balance: pocket.balance - amt }).eq('id', selectedPocket)
            }
            if (activeTab === 'transfer') {
                if (!selectedPocket || !toPocket) { setError('Select both pockets.'); setLoading(false); return }
                if (selectedPocket === toPocket) { setError('Cannot transfer to same pocket.'); setLoading(false); return }
                const from = pockets.find((p) => p.id === selectedPocket)
                const to = pockets.find((p) => p.id === toPocket)
                if (from && amt > from.balance) { setError(`Insufficient balance in ${from.name}.`); setLoading(false); return }

                // Record two transaction rows for double entry transfer visibility
                await supabase.from('fin_transactions').insert([
                    { type: 'transfer', amount: amt, pocket_id: selectedPocket, description: `Transfer to ${to?.name || 'pocket'}`, date: new Date().toISOString().split('T')[0] },
                    { type: 'allocate', amount: amt, pocket_id: toPocket, description: `Transfer from ${from?.name || 'pocket'}`, date: new Date().toISOString().split('T')[0] }
                ])
                if (from) await supabase.from('fin_pockets').update({ balance: from.balance - amt }).eq('id', from.id)
                if (to) await supabase.from('fin_pockets').update({ balance: to.balance + amt }).eq('id', to.id)
            }
            onSuccess(); handleClose()
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Unknown error')
        } finally { setLoading(false) }
    }


    const tabs: { id: Tab; label: string; icon: typeof Plus; color: string }[] = [
        { id: 'income', label: 'Add Income', icon: ArrowDownToLine, color: '#059669' },
        { id: 'spend', label: 'Log Spend', icon: ArrowUpFromLine, color: '#dc2626' },
        { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight, color: '#2563eb' },
    ]

    return (
        <>
            {/* FAB */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-[#7c3aed] shadow-lg shadow-[#7c3aed]/25 flex items-center justify-center hover:bg-[#6d28d9] active:scale-95 transition-all z-40"
            >
                <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />
                    <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
                            <p className="text-[15px] font-bold text-black">Quick Action</p>
                            <button onClick={handleClose} className="w-7 h-7 rounded-lg bg-black/[0.04] flex items-center justify-center hover:bg-black/[0.08] transition-colors">
                                <X className="w-4 h-4 text-black/40" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 p-3 border-b border-black/[0.06]">
                            {tabs.map(({ id, label, icon: Icon, color }) => (
                                <button
                                    key={id}
                                    onClick={() => handleTabChange(id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[12px] font-semibold transition-all ${activeTab === id ? 'bg-black/[0.05] text-black' : 'text-black/40 hover:text-black/60'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" style={{ color: activeTab === id ? color : undefined }} />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Form */}
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">Amount (£)</label>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                                    className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-3 text-xl font-bold text-black placeholder-black/20 outline-none focus:border-[#7c3aed]/40 transition-colors" />
                            </div>

                            <div>
                                <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">
                                    {activeTab === 'income' ? 'Into Pocket' : 'From Pocket'}
                                </label>
                                <select value={selectedPocket} onChange={(e) => setSelectedPocket(e.target.value)}
                                    className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-black outline-none focus:border-[#7c3aed]/40 appearance-none">
                                    <option value="">Select pocket…</option>
                                    {pockets.map((p) => <option key={p.id} value={p.id}>{p.name} — £{p.balance?.toFixed(2) ?? '0.00'}</option>)}
                                </select>
                            </div>

                            {activeTab === 'transfer' && (
                                <div>
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">To Pocket</label>
                                    <select value={toPocket} onChange={(e) => setToPocket(e.target.value)}
                                        className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-black outline-none focus:border-[#7c3aed]/40 appearance-none">
                                        <option value="">Select pocket…</option>
                                        {pockets.filter((p) => p.id !== selectedPocket).map((p) => <option key={p.id} value={p.id}>{p.name} — £{p.balance?.toFixed(2) ?? '0.00'}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">Note (optional)</label>
                                <input value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder={activeTab === 'income' ? 'Weekly paycheck' : 'What was this for?'}
                                    className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-black placeholder-black/20 outline-none focus:border-[#7c3aed]/40 transition-colors" />
                            </div>

                            {error && (
                                <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                            )}

                            <button onClick={handleSubmit} disabled={loading}
                                className="w-full py-3 rounded-xl bg-[#7c3aed] text-white font-semibold text-[14px] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                                {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                                    : activeTab === 'income' ? 'Add Income' : activeTab === 'spend' ? 'Log Spend' : 'Transfer'
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
