'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, Loader2, Settings, ArrowUp, ArrowDown } from 'lucide-react'
import { usePockets } from '@/features/finance/hooks/usePockets'
import { useRecurring } from '@/features/finance/hooks/useRecurring'
import { useGoals } from '@/features/finance/hooks/useGoals'
import { useSettings } from '@/features/finance/hooks/useSettings'
import type { Pocket, Goal, RecurringObligation } from '@/features/finance/types/finance.types'
import { useFinanceProfile } from '@/features/finance/contexts/FinanceProfileContext'
import { FINANCE_CATEGORIES } from '@/features/finance/constants/categories'
import { getLenderLogo } from '@/features/finance/utils/lenderLogos'

export default function SettingsPage() {
    const { activeProfile, setProfile } = useFinanceProfile()
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-black/[0.06] bg-white">
                <div className="w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center">
                    <Settings className="w-4 h-4 text-black/40" />
                </div>
                <div>
                    <h1 className="text-[20px] font-bold text-black">Settings</h1>
                    <p className="text-[12px] text-black/35">Configure your {activeProfile === 'personal' ? 'Personal' : 'Studio Karrtesian'} module</p>
                </div>
                <div className="ml-auto flex bg-black/[0.04] p-1 rounded-xl border border-black/[0.06]">
                    <button
                        onClick={() => setProfile('personal')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeProfile === 'personal' ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black/60'}`}
                    >
                        Personal
                    </button>
                    <button
                        onClick={() => setProfile('business')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeProfile === 'business' ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black/60'}`}
                    >
                        Business
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#fafafa] p-6 space-y-8">
                <GlobalSettings />
                <PocketsSettings />
                <RecurringObligationsSettings />
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

const LENDERS = [
    { id: 'klarna', name: 'Klarna', emoji: '💗', color: '#ffb3c7' },
    { id: 'clearpay', name: 'Clearpay', emoji: '💚', color: '#b2fce1' },
    { id: 'currys', name: 'Currys Flexipay', emoji: '💜', color: '#6c3082' },
    { id: 'other', name: 'Other / Subscription', emoji: '💸', color: '#f3f4f6' },
]

/* ─── Recurring Obligations ──────────────────────── */
function RecurringObligationsSettings() {
    const { obligations, loading, createObligation, updateObligation, deleteObligation, markObligationAsPaid } = useRecurring()
    const [adding, setAdding] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState<Partial<RecurringObligation>>({
        frequency: 'monthly',
        amount: 0,
        category: 'other',
        emoji: '💸',
        payments_left: null
    })

    // Explicitly track the picked lender ID so custom typing doesn't destroy the input
    const [selectedLenderId, setSelectedLenderId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const calculateEndDate = (startDate: string, frequency: string, paymentsLeft: number) => {
        if (!startDate || paymentsLeft <= 0) return null
        const date = new Date(startDate)
        const totalPayments = paymentsLeft - 1 // One is today/next
        if (totalPayments <= 0) return startDate

        if (frequency === 'weekly') date.setDate(date.getDate() + (totalPayments * 7))
        else if (frequency === 'bi-weekly') date.setDate(date.getDate() + (totalPayments * 14))
        else if (frequency === 'monthly') date.setMonth(date.getMonth() + totalPayments)
        else if (frequency === 'yearly') date.setFullYear(date.getFullYear() + totalPayments)

        return date.toISOString().split('T')[0]
    }

    const handleSave = async (isEdit: boolean = false) => {
        if (!form.name || !form.amount || !form.next_due_date || !form.frequency) return
        setSaving(true)

        let endDate = form.end_date || null
        if (form.payments_left && form.payments_left > 0) {
            endDate = calculateEndDate(form.next_due_date, form.frequency, form.payments_left)
        }

        try {
            const data = {
                name: form.name,
                amount: form.amount,
                frequency: form.frequency,
                next_due_date: form.next_due_date,
                end_date: endDate,
                group_name: form.group_name || null,
                category: form.category || 'other',
                emoji: form.emoji || '💸',
                description: form.description || null,
                payments_left: form.payments_left || null
            }

            if (isEdit && editId) {
                await updateObligation(editId, data)
                setEditId(null)
            } else {
                await createObligation(data)
                setAdding(false)
            }
            setForm({ frequency: 'monthly', amount: 0, category: 'other', emoji: '💸', payments_left: null })
        } catch (e: any) {
            alert(`Failed to save obligation: ${e.message || 'Unknown error'}`)
        } finally {
            setSaving(false)
        }
    }

    const startEdit = (o: RecurringObligation) => {
        setEditId(o.id)
        setAdding(false)
        setForm({
            name: o.name,
            amount: o.amount,
            frequency: o.frequency,
            next_due_date: o.next_due_date,
            end_date: o.end_date,
            group_name: o.group_name,
            category: o.category || 'other',
            emoji: o.emoji || '💸',
            description: o.description,
            payments_left: o.payments_left
        })
    }

    return (
        <Section title="Recurring Obligations" desc="Track active subscriptions and debt schedules">
            {loading ? <Spinner /> : (
                <div className="space-y-4">
                    {obligations.length > 0 && (
                        <div className="space-y-2">
                            {obligations.map((o) => (
                                <div key={o.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-black/[0.07] bg-white p-3">
                                    {(() => {
                                        const logo = getLenderLogo(o.name)
                                        return logo ? (
                                            <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.07] flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                                                <img src={logo} alt={o.name} className="w-full h-full object-contain p-1" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                                style={{ backgroundColor: LENDERS.find(l => l.name === o.name)?.color + '20' || '#00000008' }}>
                                                {o.emoji || '💸'}
                                            </div>
                                        )
                                    })()}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] text-black/80 font-bold truncate">{o.name}</span>
                                            {o.description && <span className="text-[11px] text-black/40 truncate">— {o.description}</span>}
                                            {o.group_name && <span className="text-[10px] uppercase font-bold tracking-wider text-black/40 bg-black/[0.04] px-1.5 py-0.5 rounded">{o.group_name}</span>}
                                        </div>
                                        <div className="text-[11px] text-black/40 mt-0.5">
                                            Next: {o.next_due_date} {o.payments_left ? `(${o.payments_left} left)` : ''}
                                            {o.end_date && ` • Ends: ${o.end_date}`}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 sm:ml-auto">
                                        <span className="text-[11px] text-black/40 capitalize px-2 py-1 bg-black/[0.03] rounded-lg border border-black/[0.05]">{o.frequency}</span>
                                        <span className="text-[13px] text-red-600 font-bold w-24 text-right">£{o.amount.toFixed(2)}</span>
                                        <div className="flex items-center gap-1 ml-1">
                                            <button onClick={() => markObligationAsPaid(o)} title="Mark as Paid" className="icon-btn text-black/20 hover:text-emerald-500"><Check className="w-4 h-4" /></button>
                                            <button onClick={() => startEdit(o)} className="icon-btn text-black/20 hover:text-black/60"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => deleteObligation(o.id)} className="icon-btn text-black/20 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {(adding || editId) ? (
                        <div className="rounded-xl border border-[#7c3aed]/20 bg-[#7c3aed]/5 p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">Lender / Name</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {LENDERS.map(l => (
                                            <button key={l.id}
                                                onClick={() => {
                                                    setSelectedLenderId(l.id)
                                                    setForm({ ...form, name: l.id === 'other' ? '' : l.name, emoji: l.emoji, category: l.id === 'other' ? 'other' : 'bills' });
                                                }}
                                                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedLenderId === l.id ? 'bg-white border-[#7c3aed] shadow-sm' : 'bg-black/[0.02] border-black/[0.05] hover:bg-black/[0.04]'}`}>
                                                {getLenderLogo(l.name) ? (
                                                    <div className="w-7 h-7 rounded-lg bg-white border border-black/[0.07] flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                                                        <img src={getLenderLogo(l.name)!} alt={l.name} className="w-full h-full object-contain p-0.5" />
                                                    </div>
                                                ) : (
                                                    <span className="text-xl">{l.emoji}</span>
                                                )}
                                                <span className="text-[11px] font-bold text-black/60 uppercase tracking-tight">{l.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {selectedLenderId === 'other' && (
                                        <input className="input-field w-full mt-2" placeholder="Custom lender or service name..." value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                    )}
                                </div>
                                <div>
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">Description / Note</label>
                                    <input className="input-field w-full" placeholder="e.g. Amazon purchase, Dominoes" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">Amount (£)</label>
                                    <input className="input-field w-full" type="number" placeholder="0.00" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">Frequency</label>
                                    <select className="input-field w-full" value={form.frequency ?? 'monthly'} onChange={(e) => setForm({ ...form, frequency: e.target.value as any })}>
                                        <option value="weekly">Weekly</option>
                                        <option value="bi-weekly">Bi-weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">Next Payment Date</label>
                                    <input className="input-field w-full" type="date" value={form.next_due_date ?? ''} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} />
                                </div>

                                {(selectedLenderId === 'klarna' || selectedLenderId === 'clearpay') ? (
                                    <div>
                                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">Payments Left</label>
                                        <input className="input-field w-full" type="number" placeholder="e.g. 3" value={form.payments_left ?? ''} onChange={(e) => setForm({ ...form, payments_left: parseInt(e.target.value) })} />
                                    </div>
                                ) : (
                                    <div className={selectedLenderId === 'currys' ? '' : 'opacity-40 grayscale pointer-events-none'}>
                                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">End Date (optional)</label>
                                        <input className="input-field w-full" type="date" value={form.end_date ?? ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                                    </div>
                                )}

                                <div>
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold mb-1.5 block">Grouping Name</label>
                                    <input className="input-field w-full" placeholder="e.g. Currys TV" value={form.group_name ?? ''} onChange={(e) => setForm({ ...form, group_name: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => handleSave(!!editId)} disabled={saving} className="btn-primary flex-1 h-11">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? 'Update Obligation' : 'Add Obligation'}
                                </button>
                                <button onClick={() => { setAdding(false); setEditId(null); setSelectedLenderId(null); setForm({ frequency: 'monthly', amount: 0, category: 'other', emoji: '💸', payments_left: null }); }} className="btn-secondary px-6 h-11">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => { setAdding(true); setSelectedLenderId('other'); }} className="flex items-center gap-2 text-[12px] text-black/50 hover:text-black/80 font-medium transition-colors border border-dashed border-black/10 hover:border-black/30 w-full p-4 rounded-xl justify-center bg-black/[0.01] hover:bg-black/[0.03]">
                            <Plus className="w-4 h-4" /> Add new subscription or debt
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
    const [form, setForm] = useState<Partial<Goal>>({ current_amount: 0, is_recurring: false })
    const [saving, setSaving] = useState(false)

    const handleAdd = async () => {
        if (!form.name || !form.target_amount) return
        setSaving(true)
        await createGoal({
            name: form.name!,
            target_amount: form.target_amount!,
            current_amount: form.current_amount ?? 0,
            deadline: form.deadline ?? null,
            is_recurring: form.is_recurring ?? false,
        })
        setForm({ current_amount: 0, is_recurring: false })
        setAdding(false)
        setSaving(false)
    }

    const handleUpdate = async (id: string) => {
        setSaving(true)
        await updateGoal(id, { name: form.name, target_amount: form.target_amount, current_amount: form.current_amount, deadline: form.deadline, is_recurring: form.is_recurring })
        setEditId(null)
        setSaving(false)
    }

    const startEdit = (g: Goal) => {
        setEditId(g.id)
        setForm({ name: g.name, target_amount: g.target_amount, current_amount: g.current_amount, deadline: g.deadline, is_recurring: g.is_recurring })
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
                                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0 bg-black/[0.03] p-1.5 rounded-lg border border-black/[0.05]">
                                        <input type="checkbox" checked={form.is_recurring || false} onChange={e => setForm({ ...form, is_recurring: e.target.checked })} className="accent-[#7c3aed] w-3 h-3 cursor-pointer" />
                                        <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Recurring</span>
                                    </label>
                                    <button onClick={() => handleUpdate(g.id)} disabled={saving} className="icon-btn text-emerald-600"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditId(null)} className="icon-btn text-black/30"><X className="w-4 h-4" /></button>
                                </>

                            ) : (
                                <>
                                    <span className="flex-1 text-[13px] text-black/80 font-medium">{g.name}</span>
                                    <span className="text-[12px] text-black/50">£{g.current_amount.toFixed(2)} / £{g.target_amount.toFixed(2)}</span>
                                    {g.is_recurring && <span className="text-[9px] font-bold bg-[#7c3aed]/10 text-[#7c3aed] px-1.5 py-0.5 rounded tracking-widest uppercase">Recurring</span>}
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

                            <div className="col-span-2 flex items-center mt-1">
                                <label className="flex items-center gap-2 cursor-pointer bg-white border border-black/[0.08] p-2.5 rounded-lg hover:border-black/[0.15] transition-colors w-full">
                                    <input type="checkbox" checked={form.is_recurring || false} onChange={e => setForm({ ...form, is_recurring: e.target.checked })} className="w-4 h-4 accent-[#7c3aed] cursor-pointer" />
                                    <span className="text-[12px] font-semibold text-black/70">This is a recurring target (e.g. Rent, Bills)</span>
                                </label>
                            </div>

                            <div className="col-span-2 flex gap-2 pt-2">
                                <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">{saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Goal'}</button>
                                <button onClick={() => { setAdding(false); setForm({ current_amount: 0, is_recurring: false }) }} className="btn-secondary flex-1">Cancel</button>
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
