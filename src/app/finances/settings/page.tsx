'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, Loader2, Settings, ArrowUp, ArrowDown } from 'lucide-react'
import { usePockets } from '@/features/finance/hooks/usePockets'
import { useDebts } from '@/features/finance/hooks/useDebts'
import { useGoals } from '@/features/finance/hooks/useGoals'
import { useSettings } from '@/features/finance/hooks/useSettings'
import type { Pocket, Debt, Goal } from '@/features/finance/types/finance.types'

export default function SettingsPage() {
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-black/[0.06] bg-white">
                <div className="w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center">
                    <Settings className="w-4 h-4 text-black/40" />
                </div>
                <div>
                    <h1 className="text-[20px] font-bold text-black">Settings</h1>
                    <p className="text-[12px] text-black/35">Configure your finance module</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#fafafa] p-6 space-y-8">
                <GlobalSettings />
                <PocketsSettings />
                <DebtsSettings />
                <GoalsSettings />
            </div>
        </div>
    )
}

/* ─── Global Settings ────────────────────────────── */
function GlobalSettings() {
    const { settings, setSetting, loading } = useSettings()
    const [income, setIncome] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        await setSetting('weekly_income_baseline', income || '0')
        setSaving(false)
    }

    return (
        <Section title="Income Baseline" desc="Set your standard expected weekly income">
            {loading ? <Spinner /> : (
                <div className="flex items-end gap-3 max-w-xs">
                    <div className="flex-1">
                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">
                            Weekly Income (£)
                        </label>
                        <input
                            type="number"
                            placeholder={settings['weekly_income_baseline'] ?? '0'}
                            value={income}
                            onChange={(e) => setIncome(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <button onClick={handleSave} disabled={saving} className="btn-primary h-10 px-4">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </button>
                </div>
            )}
            {settings['weekly_income_baseline'] && (
                <p className="text-[12px] text-black/35 mt-2">
                    Current baseline: <span className="text-black/60 font-medium">£{settings['weekly_income_baseline']}/week</span>
                </p>
            )}
        </Section>
    )
}

/* ─── Pockets ────────────────────────────────────── */
function PocketsSettings() {
    const { pockets, loading, createPocket, updatePocket, deletePocket, updatePocketsOrder } = usePockets()
    const [adding, setAdding] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState<Partial<Pocket>>({ type: 'general', target_budget: 0, current_balance: 0 })
    const [saving, setSaving] = useState(false)

    const handleAdd = async () => {
        if (!form.name) return
        setSaving(true)
        try {
            await createPocket({ name: form.name!, target_budget: form.target_budget ?? 0, current_balance: form.current_balance ?? 0, balance: 0, sort_order: pockets.length, type: (form.type as Pocket['type']) ?? 'general' })
            setForm({ type: 'general', target_budget: 0, current_balance: 0 })
            setAdding(false)
        } catch (e: any) {
            alert(`Failed to create pocket: ${e.message || 'Unknown error'}`)
        } finally {
            setSaving(false)
        }
    }

    const movePocket = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === pockets.length - 1) return;

        const newPockets = [...pockets];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        const temp = newPockets[index];
        newPockets[index] = newPockets[swapIndex];
        newPockets[swapIndex] = temp;

        const updates = newPockets.map((p, i) => ({ id: p.id, sort_order: i }));
        setSaving(true);
        try {
            await updatePocketsOrder(updates);
        } catch (e: any) {
            alert(`Failed to reorder: ${e.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id: string) => {
        setSaving(true)
        try {
            await updatePocket(id, { name: form.name, target_budget: form.target_budget, type: form.type as Pocket['type'] })
            setEditId(null)
        } catch (e: any) {
            alert(`Failed to update pocket: ${e.message || 'Unknown error'}`)
        } finally {
            setSaving(false)
        }
    }

    const startEdit = (p: Pocket) => {
        setEditId(p.id)
        setForm({ name: p.name, target_budget: p.target_budget, type: p.type })
    }

    return (
        <Section title="Pockets" desc="Create and manage your spending allocations">
            {loading ? <Spinner /> : (
                <div className="space-y-2">
                    {pockets.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white p-3">
                            {editId === p.id ? (
                                <>
                                    <input className="input-field flex-1" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                    <input className="input-field w-32" type="number" value={form.target_budget ?? 0} onChange={(e) => setForm({ ...form, target_budget: parseFloat(e.target.value) })} placeholder="Weekly alloc £" />
                                    <select className="input-field w-28" value={form.type ?? 'general'} onChange={(e) => setForm({ ...form, type: e.target.value as Pocket['type'] })}>
                                        <option value="general">General</option>
                                        <option value="buffer">Buffer</option>
                                        <option value="savings">Savings</option>
                                    </select>
                                    <button onClick={() => handleUpdate(p.id)} disabled={saving} className="icon-btn text-emerald-600"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditId(null)} className="icon-btn text-black/30"><X className="w-4 h-4" /></button>
                                </>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-0.5 mr-2">
                                        <button onClick={() => movePocket(i, 'up')} disabled={i === 0 || saving} className="text-black/20 hover:text-black/60 disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                                        <button onClick={() => movePocket(i, 'down')} disabled={i === pockets.length - 1 || saving} className="text-black/20 hover:text-black/60 disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                                    </div>
                                    <span className="flex-1 text-[13px] text-black/80 font-medium">{p.name}</span>
                                    <span className="text-[11px] text-black/35 capitalize">{p.type}</span>
                                    <span className="text-[12px] text-black/45 w-32 text-right">Weekly alloc: £{p.target_budget.toFixed(2)}</span>
                                    <button onClick={() => startEdit(p)} className="icon-btn text-black/25 hover:text-black/60"><Pencil className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => deletePocket(p.id)} className="icon-btn text-black/20 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </>
                            )}
                        </div>
                    ))}

                    {adding ? (
                        <div className="flex items-center gap-3 rounded-xl border border-[#7c3aed]/20 bg-[#7c3aed]/5 p-3">
                            <input className="input-field flex-1" placeholder="Pocket name" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            <input className="input-field w-32" type="number" placeholder="Weekly alloc £" value={form.target_budget ?? ''} onChange={(e) => setForm({ ...form, target_budget: parseFloat(e.target.value) })} />
                            <select className="input-field w-28" value={form.type ?? 'general'} onChange={(e) => setForm({ ...form, type: e.target.value as Pocket['type'] })}>
                                <option value="general">General</option>
                                <option value="buffer">Buffer</option>
                                <option value="savings">Savings</option>
                            </select>
                            <button onClick={handleAdd} disabled={saving} className="icon-btn text-emerald-600"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setAdding(false)} className="icon-btn text-black/30"><X className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <button onClick={() => setAdding(true)} className="flex items-center gap-2 text-[12px] text-black/35 hover:text-black/60 transition-colors px-2 py-1.5">
                            <Plus className="w-3.5 h-3.5" /> Add pocket
                        </button>
                    )}
                </div>
            )}
        </Section>
    )
}

/* ─── Debts ──────────────────────────────────────── */
function DebtsSettings() {
    const { debts, loading, createDebt, deleteDebt } = useDebts()
    const [adding, setAdding] = useState(false)
    const [form, setForm] = useState<Partial<Debt>>({ type: 'Short-Term', monthly_payment: 0, total_amount: 0 })
    const [saving, setSaving] = useState(false)

    const handleAdd = async () => {
        if (!form.name || !form.total_amount) return
        setSaving(true)
        await createDebt({
            name: form.name!,
            total_amount: form.total_amount!,
            remaining_balance: form.remaining_balance ?? form.total_amount!,
            monthly_payment: form.monthly_payment ?? 0,
            due_date_of_month: form.due_date_of_month ?? null,
            type: (form.type as Debt['type']) ?? 'Short-Term',
        })
        setForm({ type: 'Short-Term', monthly_payment: 0, total_amount: 0 })
        setAdding(false)
        setSaving(false)
    }

    return (
        <Section title="Credit Agreements" desc="Track your active debts and payment schedules">
            {loading ? <Spinner /> : (
                <div className="space-y-2">
                    {debts.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white p-3">
                            <span className="flex-1 text-[13px] text-black/80 font-medium">{d.name}</span>
                            <span className="text-[11px] text-black/35">{d.type}</span>
                            <span className="text-[12px] text-black/50">£{d.remaining_balance.toFixed(2)} / £{d.total_amount.toFixed(2)}</span>
                            <span className="text-[12px] text-amber-600 font-medium">£{d.monthly_payment.toFixed(2)}/mo</span>
                            <button onClick={() => deleteDebt(d.id)} className="icon-btn text-black/20 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    ))}

                    {adding ? (
                        <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#7c3aed]/20 bg-[#7c3aed]/5 p-3">
                            <input className="input-field col-span-2" placeholder="Debt name/Lender (e.g. Amex, Car Loan)" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            <input className="input-field" type="number" placeholder="Total credit limit/loan £" value={form.total_amount ?? ''} onChange={(e) => setForm({ ...form, total_amount: parseFloat(e.target.value) })} />
                            <input className="input-field" type="number" placeholder="Current amount owed £" value={form.remaining_balance ?? ''} onChange={(e) => setForm({ ...form, remaining_balance: parseFloat(e.target.value) })} />
                            <input className="input-field" type="number" placeholder="Required monthly payment £" value={form.monthly_payment ?? ''} onChange={(e) => setForm({ ...form, monthly_payment: parseFloat(e.target.value) })} />
                            <input className="input-field" type="number" placeholder="Due day of month (1-31)" value={form.due_date_of_month ?? ''} onChange={(e) => setForm({ ...form, due_date_of_month: parseInt(e.target.value) })} />
                            <select className="input-field" value={form.type ?? 'Short-Term'} onChange={(e) => setForm({ ...form, type: e.target.value as Debt['type'] })}>
                                <option value="Short-Term">Short-Term (Cards, overdrafts)</option>
                                <option value="Long-Term">Long-Term (Loans, mortgages)</option>
                            </select>
                            <div className="flex gap-2 col-span-2">
                                <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">{saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add credit agreement'}</button>
                                <button onClick={() => setAdding(false)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setAdding(true)} className="flex items-center gap-2 text-[12px] text-black/35 hover:text-black/60 transition-colors px-2 py-1.5">
                            <Plus className="w-3.5 h-3.5" /> Add debt
                        </button>
                    )}
                </div>
            )}
        </Section>
    )
}

/* ─── Goals ──────────────────────────────────────── */
function GoalsSettings() {
    const { goals, loading, createGoal, updateGoal, deleteGoal } = useGoals()
    const [adding, setAdding] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState<Partial<Goal>>({ current_amount: 0 })
    const [saving, setSaving] = useState(false)

    const handleAdd = async () => {
        if (!form.name || !form.target_amount) return
        setSaving(true)
        await createGoal({
            name: form.name!,
            target_amount: form.target_amount!,
            current_amount: form.current_amount ?? 0,
            deadline: form.deadline ?? null,
        })
        setForm({ current_amount: 0 })
        setAdding(false)
        setSaving(false)
    }

    const handleUpdate = async (id: string) => {
        setSaving(true)
        await updateGoal(id, { name: form.name, target_amount: form.target_amount, current_amount: form.current_amount, deadline: form.deadline })
        setEditId(null)
        setSaving(false)
    }

    const startEdit = (g: Goal) => {
        setEditId(g.id)
        setForm({ name: g.name, target_amount: g.target_amount, current_amount: g.current_amount, deadline: g.deadline })
    }

    return (
        <Section title="Savings Goals" desc="Define long-term saving targets">
            {loading ? <Spinner /> : (
                <div className="space-y-2">
                    {goals.map((g) => (
                        <div key={g.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-black/[0.07] bg-white p-3">
                            {editId === g.id ? (
                                <>
                                    <input className="input-field flex-1 min-w-[120px]" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                    <input className="input-field w-28" type="number" placeholder="Total target £" value={form.target_amount ?? 0} onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) })} />
                                    <input className="input-field w-28" type="number" placeholder="Already saved £" value={form.current_amount ?? 0} onChange={(e) => setForm({ ...form, current_amount: parseFloat(e.target.value) })} />
                                    <input className="input-field w-32" type="date" value={form.deadline ?? ''} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                                    <button onClick={() => handleUpdate(g.id)} disabled={saving} className="icon-btn text-emerald-600"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditId(null)} className="icon-btn text-black/30"><X className="w-4 h-4" /></button>
                                </>

                            ) : (
                                <>
                                    <span className="flex-1 text-[13px] text-black/80 font-medium">{g.name}</span>
                                    <span className="text-[12px] text-black/50">£{g.current_amount.toFixed(2)} / £{g.target_amount.toFixed(2)}</span>
                                    {g.deadline && <span className="text-[11px] text-black/35">{g.deadline}</span>}
                                    <button onClick={() => startEdit(g)} className="icon-btn text-black/25 hover:text-black/60"><Pencil className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => deleteGoal(g.id)} className="icon-btn text-black/20 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </>
                            )}
                        </div>
                    ))}

                    {adding ? (
                        <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#7c3aed]/20 bg-[#7c3aed]/5 p-3">
                            <input className="input-field col-span-2" placeholder="Goal name (e.g. UK GTV Visa)" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            <input className="input-field" type="number" placeholder="Total target amount £" value={form.target_amount ?? ''} onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) })} />
                            <input className="input-field" type="number" placeholder="Amount already saved £" value={form.current_amount ?? ''} onChange={(e) => setForm({ ...form, current_amount: parseFloat(e.target.value) })} />
                            <input className="input-field col-span-2" type="date" value={form.deadline ?? ''} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                            <div className="col-span-2 flex gap-2">
                                <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">{saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Goal'}</button>
                                <button onClick={() => setAdding(false)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setAdding(true)} className="flex items-center gap-2 text-[12px] text-black/35 hover:text-black/60 transition-colors px-2 py-1.5">
                            <Plus className="w-3.5 h-3.5" /> Add goal
                        </button>
                    )}
                </div>
            )}
        </Section>
    )
}

/* ─── Shared UI ──────────────────────────────────── */
function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-4">
                <h2 className="text-[15px] font-bold text-black">{title}</h2>
                <p className="text-[12px] text-black/35 mt-0.5">{desc}</p>
            </div>
            <div className="rounded-xl border border-black/[0.07] bg-white p-4 shadow-sm">
                {children}
            </div>
        </div>
    )
}

function Spinner() {
    return (
        <div className="flex items-center gap-2 text-black/30 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[12px]">Loading…</span>
        </div>
    )
}
