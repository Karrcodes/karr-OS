'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import { usePots } from '@/features/finance/hooks/usePots'
import type { Pot } from '@/features/finance/types/finance.types'
import { Section, Spinner } from './SharedSettingsUI'

export function SavingsPotsSettings() {
    const { pots, loading, createPot, updatePot, deletePot, updatePotsOrder } = usePots()
    const [adding, setAdding] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState<Partial<Pot>>({ type: 'savings', target_budget: 0, current_balance: 0, balance: 0 })
    const [saving, setSaving] = useState(false)

    const savingsPots = pots.filter(p => p.type === 'savings')

    const handleAdd = async () => {
        if (!form.name) return
        setSaving(true)
        try {
            await createPot({
                name: form.name!,
                target_budget: form.target_budget ?? 0,
                target_amount: form.target_amount ?? 0,
                current_balance: form.current_balance ?? 0,
                balance: form.balance ?? 0,
                sort_order: pots.length,
                type: 'savings'
            })
            setForm({ type: 'savings', target_budget: 0, current_balance: 0, balance: 0 })
            setAdding(false)
        } catch (e: any) {
            alert(`Failed to create pot: ${e.message || 'Unknown error'}`)
        } finally {
            setSaving(false)
        }
    }

    const movePot = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === savingsPots.length - 1) return;

        const newSavingsPots = [...savingsPots];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        const temp = newSavingsPots[index];
        newSavingsPots[index] = newSavingsPots[swapIndex];
        newSavingsPots[swapIndex] = temp;

        // Map back to global pots order
        const allPotsCopy = [...pots];
        const p1 = savingsPots[index];
        const p2 = savingsPots[swapIndex];

        const idx1 = allPotsCopy.findIndex(p => p.id === p1.id);
        const idx2 = allPotsCopy.findIndex(p => p.id === p2.id);

        const tempSort = allPotsCopy[idx1].sort_order;
        allPotsCopy[idx1].sort_order = allPotsCopy[idx2].sort_order;
        allPotsCopy[idx2].sort_order = tempSort;

        const updates = [
            { id: p1.id, sort_order: allPotsCopy[idx1].sort_order },
            { id: p2.id, sort_order: allPotsCopy[idx2].sort_order }
        ];

        setSaving(true);
        try {
            await updatePotsOrder(updates);
        } catch (e: any) {
            alert(`Failed to reorder: ${e.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id: string) => {
        setSaving(true)
        try {
            await updatePot(id, {
                name: form.name,
                target_budget: form.target_budget,
                target_amount: form.target_amount,
                balance: form.balance
            })
            setEditId(null)
        } catch (e: any) {
            alert(`Failed to update pot: ${e.message || 'Unknown error'}`)
        } finally {
            setSaving(false)
        }
    }

    const startEdit = (p: Pot) => {
        setEditId(p.id)
        setForm({
            name: p.name,
            target_budget: p.target_budget,
            target_amount: p.target_amount,
            type: p.type,
            balance: p.balance
        })
    }

    return (
        <Section title="Manage Savings Pots" desc="Configure your long-term savings allocations and targets">
            {loading ? <Spinner /> : (
                <div className="space-y-2">
                    {savingsPots.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white p-3">
                            {editId === p.id ? (
                                <>
                                    <input className="input-field flex-1" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pot Name" />
                                    <input className="input-field w-24 text-blue-600 font-medium" type="number" value={form.balance ?? 0} onChange={(e) => setForm({ ...form, balance: parseFloat(e.target.value) })} title="Current Balance" />
                                    <input className="input-field w-28" type="number" value={form.target_amount ?? 0} onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) })} title="Total Goal Target" placeholder="Target £" />
                                    <input className="input-field w-24" type="number" value={form.target_budget ?? 0} onChange={(e) => setForm({ ...form, target_budget: parseFloat(e.target.value) })} title="Weekly Allocation" placeholder="Weekly £" />
                                    <button onClick={() => handleUpdate(p.id)} disabled={saving} className="icon-btn text-emerald-600"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditId(null)} className="icon-btn text-black/30"><X className="w-4 h-4" /></button>
                                </>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-0.5 mr-2">
                                        <button onClick={() => movePot(i, 'up')} disabled={i === 0 || saving} className="text-black/20 hover:text-black/60 disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                                        <button onClick={() => movePot(i, 'down')} disabled={i === savingsPots.length - 1 || saving} className="text-black/20 hover:text-black/60 disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <span className="text-[13px] text-black/80 font-medium">{p.name}</span>
                                        <span className="text-[11px] text-black/40 font-normal privacy-blur">Balance: £{(p.balance || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[12px] text-black/45">Target: <span className="privacy-blur font-medium text-black/60">£{(p.target_amount || 0).toFixed(2)}</span></div>
                                        <div className="text-[10px] text-black/30">Weekly: <span className="privacy-blur font-medium">£{p.target_budget.toFixed(2)}</span></div>
                                    </div>
                                    <button onClick={() => startEdit(p)} className="icon-btn text-black/25 hover:text-black/60"><Pencil className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => deletePot(p.id)} className="icon-btn text-black/20 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </>
                            )}
                        </div>
                    ))}

                    {adding ? (
                        <div className="flex items-center gap-3 rounded-xl border border-black/20 bg-black/5 p-3">
                            <input className="input-field flex-1" placeholder="Savings name" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            <input className="input-field w-24 text-blue-600 font-medium" type="number" placeholder="Start £" value={form.balance ?? ''} onChange={(e) => setForm({ ...form, balance: parseFloat(e.target.value) })} title="Starting Balance" />
                            <input className="input-field w-28" type="number" placeholder="Target £" value={form.target_amount ?? ''} onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) })} title="Total Goal Target" />
                            <input className="input-field w-24" type="number" placeholder="Weekly £" value={form.target_budget ?? ''} onChange={(e) => setForm({ ...form, target_budget: parseFloat(e.target.value) })} title="Weekly Allocation" />
                            <button onClick={handleAdd} disabled={saving} className="icon-btn text-emerald-600"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setAdding(false)} className="icon-btn text-black/30"><X className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <button onClick={() => setAdding(true)} className="flex items-center gap-2 text-[12px] text-black/35 hover:text-black/60 transition-colors px-2 py-1.5">
                            <Plus className="w-3.5 h-3.5" /> Add savings pot
                        </button>
                    )}
                </div>
            )}
        </Section>
    )
}
