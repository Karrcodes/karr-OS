'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, Loader2 } from 'lucide-react'
import { useRecurring } from '@/features/finance/hooks/useRecurring'
import type { RecurringObligation } from '@/features/finance/types/finance.types'
import { getLenderLogo } from '@/features/finance/utils/lenderLogos'
import { Section, Spinner } from '@/features/finance/components/SharedSettingsUI'

const LENDERS = [
    { id: 'klarna', name: 'Klarna', emoji: '💗', color: '#ffb3c7' },
    { id: 'clearpay', name: 'Clearpay', emoji: '💚', color: '#b2fce1' },
    { id: 'currys', name: 'Currys Flexipay', emoji: '💜', color: '#6c3082' },
    { id: 'other', name: 'Other / Subscription', emoji: '💸', color: '#f3f4f6' },
]

export function LiabilitiesManager() {
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

    const [selectedLenderId, setSelectedLenderId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        action: () => Promise<void>;
        confirmText: string;
        type: 'danger' | 'warning';
    }>({
        open: false,
        title: '',
        message: '',
        action: async () => { },
        confirmText: 'Confirm',
        type: 'danger'
    })

    const calculateEndDate = (startDate: string, frequency: string, paymentsLeft: number) => {
        if (!startDate || paymentsLeft <= 0) return null
        const date = new Date(startDate)
        const totalPayments = paymentsLeft - 1
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
            alert(`Failed to save liability: ${e.message || 'Unknown error'}`)
        } finally {
            setSaving(false)
        }
    }

    const startEdit = (o: RecurringObligation) => {
        setEditId(o.id)
        setAdding(false)

        // Find if it matches a known lender, otherwise set to 'other'
        const lender = LENDERS.find(l => l.name === o.name)
        setSelectedLenderId(lender ? lender.id : 'other')

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
        <Section title="Active Liabilities" desc="Track active subscriptions and debt schedules">
            {/* Confirmation Modal */}
            {confirmModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))} />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                            confirmModal.type === 'danger' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                        )}>
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-black mb-2">{confirmModal.title}</h3>
                        <p className="text-[14px] text-black/60 mb-6 leading-relaxed">
                            {confirmModal.message}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                                className="flex-1 py-3 rounded-xl border border-black/[0.1] text-black/60 font-bold text-[14px] hover:bg-black/[0.05] transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={confirmModal.action}
                                className={cn(
                                    "flex-1 py-3 rounded-xl text-white font-bold text-[14px] transition-colors shadow-lg",
                                    confirmModal.type === 'danger' ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "bg-amber-500 hover:bg-amber-600 shadow-amber-200"
                                )}
                            >
                                {confirmModal.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? <Spinner /> : (
                <div className="space-y-4">
                    {obligations.length > 0 && (
                        <div className="space-y-2">
                            {obligations.map((o) => (
                                <div key={o.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-black/[0.07] bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
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
                                        <div className="flex flex-col min-w-0 gap-1.5 mt-0.5">
                                            <p className="text-[14px] font-bold text-black truncate">{o.name}</p>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 bg-black/5 px-2 py-0.5 rounded-md text-nowrap">
                                                    Next: {new Date(o.next_due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </span>
                                                {(o.payments_left ?? 0) > 0 && (
                                                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 text-[10px] font-bold uppercase tracking-widest text-nowrap">
                                                        {o.payments_left} left
                                                    </span>
                                                )}
                                                {o.end_date && (
                                                    <span className="text-black/30 text-[10px] font-semibold text-nowrap">
                                                        Ends {new Date(o.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto sm:ml-auto bg-black/[0.02] p-2 rounded-xl border border-black/[0.04]">
                                        <div className="flex flex-col items-start sm:items-end sm:mr-2">
                                            <span className="text-[15px] text-red-600 font-bold tracking-tight privacy-blur">£{o.amount.toFixed(2)}</span>
                                            <span className="text-[10px] text-black/40 font-bold uppercase tracking-widest">{o.frequency}</span>
                                        </div>
                                        <div className="flex items-center gap-1 border-l border-black/[0.06] pl-3">
                                            <button onClick={() => markObligationAsPaid(o)} title="Mark as Paid" className="w-8 h-8 rounded-lg flex items-center justify-center text-black/20 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"><Check className="w-4 h-4" /></button>
                                            <button onClick={() => startEdit(o)} className="w-8 h-8 rounded-lg flex items-center justify-center text-black/20 hover:text-black/60 hover:bg-black/5 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button
                                                onClick={() => {
                                                    setConfirmModal({
                                                        open: true,
                                                        title: 'Cancel Liability?',
                                                        message: `Are you sure you want to cancel and delete "${o.name}"? This will stop tracking its payments.`,
                                                        confirmText: 'Yes, Cancel',
                                                        type: 'danger',
                                                        action: async () => {
                                                            await deleteObligation(o.id)
                                                            setConfirmModal(prev => ({ ...prev, open: false }))
                                                        }
                                                    })
                                                }}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-black/20 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {(adding || editId) ? (
                        <div className="rounded-2xl border border-black/[0.08] bg-white p-6 space-y-5 shadow-sm">
                            <h3 className="text-[14px] font-bold text-black border-b border-black/[0.06] pb-3 mb-4">
                                {editId ? 'Edit Liability' : 'Add New Liability'}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2">
                                    <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-2 block">Lender / Tag</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {LENDERS.map(l => (
                                            <button key={l.id}
                                                onClick={() => {
                                                    setSelectedLenderId(l.id)
                                                    setForm({ ...form, name: l.id === 'other' ? '' : l.name, emoji: l.emoji, category: l.id === 'other' ? 'other' : 'bills' });
                                                }}
                                                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedLenderId === l.id ? 'bg-white border-black shadow-[0_2px_10px_rgba(124,58,237,0.1)] ring-1 ring-black/20' : 'bg-white border-black/[0.07] hover:border-black/[0.15] hover:bg-black/[0.01]'}`}>
                                                {getLenderLogo(l.name) ? (
                                                    <div className="w-8 h-8 rounded-lg bg-white border border-black/[0.07] flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                                                        <img src={getLenderLogo(l.name)!} alt={l.name} className="w-full h-full object-contain p-1" />
                                                    </div>
                                                ) : (
                                                    <span className="text-xl leading-none">{l.emoji}</span>
                                                )}
                                                <span className="text-[12px] font-bold text-black/70 tracking-tight">{l.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {selectedLenderId === 'other' && (
                                        <input className="input-field w-full mt-3 bg-white" placeholder="Custom lender or service name..." value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-2 block">Amount (£)</label>
                                        <input className="input-field w-full bg-white text-[16px] font-bold" type="number" placeholder="0.00" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-2 block">Frequency</label>
                                        <select className="input-field w-full bg-white" value={form.frequency ?? 'monthly'} onChange={(e) => setForm({ ...form, frequency: e.target.value as any })}>
                                            <option value="weekly">Weekly</option>
                                            <option value="bi-weekly">Bi-weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-2 block">Next Payment Date</label>
                                        <input className="input-field w-full bg-white" type="date" value={form.next_due_date ?? ''} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-4 bg-white p-4 rounded-xl border border-black/[0.06]">
                                    <div>
                                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-2 block">Description / Note</label>
                                        <input className="input-field w-full bg-white" placeholder="e.g. Amazon purchase, Dominoes" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                    </div>
                                    {(selectedLenderId === 'klarna' || selectedLenderId === 'clearpay') ? (
                                        <div>
                                            <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-2 block">Payments Left</label>
                                            <input className="input-field w-full bg-white" type="number" placeholder="e.g. 3" value={form.payments_left ?? ''} onChange={(e) => setForm({ ...form, payments_left: parseInt(e.target.value) })} />
                                        </div>
                                    ) : (
                                        <div className={selectedLenderId === 'currys' ? '' : 'opacity-40 grayscale pointer-events-none'}>
                                            <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-2 block">End Date (optional)</label>
                                            <input className="input-field w-full bg-white" type="date" value={form.end_date ?? ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-[11px] uppercase tracking-wider text-black/40 font-bold mb-2 block">Grouping Name (optional)</label>
                                        <input className="input-field w-full bg-white" placeholder="e.g. Tech Purchases" value={form.group_name ?? ''} onChange={(e) => setForm({ ...form, group_name: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-black/[0.06] mt-6">
                                <button onClick={() => handleSave(!!editId)} disabled={saving} className="btn-primary flex-1 h-12 text-[14px]">
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : editId ? 'Save Changes' : 'Create Liability'}
                                </button>
                                <button onClick={() => {
                                    setAdding(false);
                                    setEditId(null);
                                    setSelectedLenderId(null);
                                    setForm({ frequency: 'monthly', amount: 0, category: 'other', emoji: '💸', payments_left: null });
                                }} className="btn-secondary px-8 h-12 text-[14px]">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => {
                            setAdding(true);
                            setSelectedLenderId('other');
                            setForm({ frequency: 'monthly', amount: 0, category: 'other', emoji: '💸', payments_left: null });
                        }} className="flex items-center gap-2 text-[13px] text-black/60 hover:text-black hover:bg-black/5 font-bold transition-all border-2 border-dashed border-black/[0.08] hover:border-black/30 w-full p-6 rounded-2xl justify-center bg-white shadow-sm">
                            <Plus className="w-5 h-5" /> Add new subscription or debt schedule
                        </button>
                    )}
                </div>
            )}
        </Section>
    )
}
