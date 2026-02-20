'use client'

import { useState, useRef } from 'react'
import { Plus, Check, Loader2, UploadCloud, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Pocket, Goal } from '../types/finance.types'
import { useIncome } from '../hooks/useIncome'
import { usePayslips } from '../hooks/usePayslips'

interface PaydayAllocationProps {
    pockets: Pocket[]
    goals: Goal[]
    onSuccess: () => void
}

export function PaydayAllocation({ pockets, goals, onSuccess }: PaydayAllocationProps) {
    const { logIncome } = useIncome()
    const { logPayslip } = usePayslips()
    const [amount, setAmount] = useState('') // This is Net Pay
    const [source, setSource] = useState('Salary')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    // Detailed fields for analytics
    const [grossPay, setGrossPay] = useState('')
    const [taxPaid, setTaxPaid] = useState('')
    const [pension, setPension] = useState('')
    const [studentLoan, setStudentLoan] = useState('')

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    // State for allocation step
    const [allocating, setAllocating] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // A map of pocket_id -> amount to allocate
    const [allocations, setAllocations] = useState<{ [key: string]: number }>({})

    const resetFields = () => {
        setAmount('')
        setGrossPay('')
        setTaxPaid('')
        setPension('')
        setStudentLoan('')
        setSource('Salary')
        setDate(new Date().toISOString().split('T')[0])
    }

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
        goals.forEach(g => {
            defaultAllocations[g.id] = 0 // Savings goals default to 0
        })
        setAllocations(defaultAllocations)
        setAllocating(true)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        setUploading(true)
        setError(null)
        setSuccessMessage(null)

        if (files.length === 1) {
            const formData = new FormData()
            formData.append('file', files[0])

            try {
                const res = await fetch('/api/ai/payslip', { method: 'POST', body: formData })
                if (!res.ok) throw new Error('Failed to parse payslip')

                const data = await res.json()
                if (data.error) throw new Error(data.error)

                if (data.netPay) setAmount(data.netPay.toString())
                if (data.employer) setSource(data.employer)
                if (data.date) setDate(data.date)

                // Detailed fields
                if (data.grossPay) setGrossPay(data.grossPay.toString())
                if (data.tax) setTaxPaid(data.tax.toString())
                if (data.pension) setPension(data.pension.toString())
                if (data.studentLoan) setStudentLoan(data.studentLoan.toString())

            } catch (err: any) {
                setError(err.message || 'AI processing failed')
            } finally {
                setUploading(false)
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        } else {
            // Batch processing multiple historical payslips
            let successCount = 0

            for (const file of files) {
                const formData = new FormData()
                formData.append('file', file)

                try {
                    const res = await fetch('/api/ai/payslip', { method: 'POST', body: formData })
                    if (!res.ok) continue

                    const data = await res.json()
                    if (data.error) continue

                    if (data.netPay && data.date) {
                        // Log to BOTH fin_income (for cashflow) and fin_payslips (for analytics)
                        await Promise.all([
                            logIncome({
                                amount: parseFloat(data.netPay),
                                source: data.employer || 'Salary',
                                date: data.date
                            }),
                            logPayslip({
                                date: data.date,
                                employer: data.employer || 'Salary',
                                net_pay: parseFloat(data.netPay),
                                gross_pay: data.grossPay ? parseFloat(data.grossPay) : null,
                                tax_paid: data.tax ? parseFloat(data.tax) : null,
                                pension_contributions: data.pension ? parseFloat(data.pension) : null,
                                student_loan: data.studentLoan ? parseFloat(data.studentLoan) : null
                            })
                        ])
                        successCount++
                    }
                } catch (err: any) {
                    // Silently fail individual records in a batch
                }
            }

            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''

            if (successCount > 0) {
                setSuccessMessage(`Successfully processed & saved ${successCount} historical payslips.`)
                onSuccess()
            } else {
                setError('Failed to process any of the uploaded payslips.')
            }
        }
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
            // 1. Log Income & Payslip
            const amt = parseFloat(amount)
            await Promise.all([
                logIncome({
                    amount: amt,
                    source: source,
                    date: date
                }),
                logPayslip({
                    date: date,
                    employer: source,
                    net_pay: amt,
                    gross_pay: grossPay ? parseFloat(grossPay) : null,
                    tax_paid: taxPaid ? parseFloat(taxPaid) : null,
                    pension_contributions: pension ? parseFloat(pension) : null,
                    student_loan: studentLoan ? parseFloat(studentLoan) : null
                })
            ])

            // 2. Process Allocations
            const transactionPromises: any[] = []
            const pocketUpdatePromises: any[] = []

            for (const [itemId, allocAmt] of Object.entries(allocations)) {
                if (allocAmt > 0) {
                    const pocket = pockets.find(p => p.id === itemId)
                    if (pocket) {
                        transactionPromises.push(
                            supabase.from('fin_transactions').insert({
                                type: 'allocate',
                                amount: allocAmt,
                                pocket_id: itemId,
                                description: `Payday allocation (${source})`,
                                date: date,
                                profile: (pockets.find(p => p.id === itemId))?.profile // Safety check
                            }).then(res => res)
                        )
                        pocketUpdatePromises.push(
                            supabase.from('fin_pockets').update({
                                balance: pocket.balance + allocAmt
                            }).eq('id', itemId).then(res => res)
                        )
                    } else {
                        const goal = goals.find(g => g.id === itemId)
                        if (goal) {
                            pocketUpdatePromises.push(
                                supabase.from('fin_goals').update({
                                    current_amount: goal.current_amount + allocAmt
                                }).eq('id', itemId).then(res => res)
                            )
                        }
                    }
                }
            }

            await Promise.all([...transactionPromises, ...pocketUpdatePromises])

            // Reset state
            resetFields()
            setAllocations({})
            setAllocating(false)
            onSuccess()

        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to save allocations.')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveWithoutAssigning = async () => {
        const amt = parseFloat(amount)
        if (!amt || amt <= 0) {
            setError('Please enter a valid income amount.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await Promise.all([
                logIncome({
                    amount: amt,
                    source: source,
                    date: date
                }),
                logPayslip({
                    date: date,
                    employer: source,
                    net_pay: amt,
                    gross_pay: grossPay ? parseFloat(grossPay) : null,
                    tax_paid: taxPaid ? parseFloat(taxPaid) : null,
                    pension_contributions: pension ? parseFloat(pension) : null,
                    student_loan: studentLoan ? parseFloat(studentLoan) : null
                })
            ])

            resetFields()
            onSuccess()
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to save income.')
        } finally {
            setLoading(false)
        }
    }

    if (allocating) {
        return (
            <div className="rounded-2xl border border-[#059669]/30 bg-[#059669]/5 p-5 shadow-sm h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-[16px] font-bold text-[#059669]">Distribute Income</h2>
                        <p className="text-[12px] text-black/60 mt-0.5">Allocate your £{parseFloat(amount).toFixed(2)} {source}</p>
                    </div>
                    <div className={`text-right ${unallocated < 0 ? 'text-red-600' : unallocated === 0 ? 'text-[#059669]' : 'text-black dark:text-white'}`}>
                        <div className="text-[20px] font-bold">£{unallocated.toFixed(2)}</div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60">To Assign</div>
                    </div>
                </div>

                <div className="space-y-4 mb-5 max-h-[400px] overflow-y-auto pr-1">
                    {pockets.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-2">Pockets</h3>
                            {pockets.map(p => (
                                <div key={p.id} className="flex items-center gap-3 bg-white dark:bg-[#0a0a0a] border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-3">
                                    <div className="flex-1">
                                        <div className="text-[13px] font-semibold text-black/80">{p.name}</div>
                                        <div className="text-[11px] text-black/40">Current: £{(p.balance ?? 0).toFixed(2)} • Target: £{p.target_budget.toFixed(2)}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] font-bold text-black/40">+£</span>
                                        <input
                                            type="number"
                                            value={allocations[p.id] ?? ''}
                                            onChange={(e) => setAllocations(prev => ({ ...prev, [p.id]: parseFloat(e.target.value) || 0 }))}
                                            className="w-24 bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] rounded-lg px-3 py-1.5 text-[14px] font-bold text-black dark:text-white text-right outline-none focus:border-[#059669]/40"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {goals.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[11px] font-bold text-black/40 uppercase tracking-wider mb-2 mt-4">Savings Goals</h3>
                            {goals.map(g => (
                                <div key={g.id} className="flex items-center gap-3 bg-white dark:bg-[#0a0a0a] border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-3">
                                    <div className="flex-1">
                                        <div className="text-[13px] font-semibold text-black/80">{g.name}</div>
                                        <div className="text-[11px] text-black/40">Saved: £{g.current_amount.toFixed(2)} • Target: £{g.target_amount.toFixed(2)}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] font-bold text-black/40">+£</span>
                                        <input
                                            type="number"
                                            value={allocations[g.id] ?? ''}
                                            onChange={(e) => setAllocations(prev => ({ ...prev, [g.id]: parseFloat(e.target.value) || 0 }))}
                                            className="w-24 bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] rounded-lg px-3 py-1.5 text-[14px] font-bold text-black dark:text-white text-right outline-none focus:border-[#059669]/40"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
        <div className="rounded-2xl border border-black/[0.08] bg-white dark:bg-[#0a0a0a] p-5 shadow-sm h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <label className="text-[11px] uppercase tracking-wider text-black/40 font-semibold block">Log Income Manually or with AI</label>

                <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || allocating}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-black dark:text-white bg-black/10 dark:bg-white dark:bg-[#0a0a0a]/10 px-3 py-1.5 rounded-lg hover:bg-black/20 dark:bg-white dark:bg-[#0a0a0a]/20 transition-colors disabled:opacity-50"
                >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    {uploading ? 'Parsing...' : 'Upload Payslip'}
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {/* Row 1: Amount & Source */}
                <div className="flex flex-row gap-3">
                    <div className="relative flex-[1.5]">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 font-bold text-[16px]">£</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl pl-8 pr-3 py-2.5 text-[16px] font-bold text-black dark:text-white placeholder-black/20 outline-none focus:border-black/40 dark:border-white/40 transition-colors"
                        />
                    </div>
                    <input
                        type="text"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="Source"
                        className="flex-1 min-w-[100px] bg-black/[0.03] border border-black/[0.08] rounded-xl px-3 py-2.5 text-[14px] text-black dark:text-white placeholder-black/20 outline-none focus:border-black/40 dark:border-white/40 transition-colors"
                    />
                </div>

                {/* Row 2: Date & Action Buttons */}
                <div className="flex flex-row gap-2">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-[120px] shrink-0 bg-black/[0.03] border border-black/[0.08] rounded-xl px-2.5 py-2.5 text-[12px] font-medium text-black dark:text-white outline-none focus:border-black/40 dark:border-white/40 transition-colors"
                    />
                    <div className="flex flex-1 gap-2">
                        <button
                            onClick={handleSaveWithoutAssigning}
                            disabled={loading || uploading || !amount}
                            className="flex-1 py-2.5 rounded-xl border border-black/[0.1] bg-white text-black/60 font-semibold text-[12px] hover:bg-black/[0.03] hover:text-black/80 transition-colors disabled:opacity-50"
                        >
                            Save
                        </button>
                        <button
                            onClick={startAllocation}
                            disabled={loading || uploading || !amount}
                            className="flex-[1.5] py-2.5 rounded-xl bg-black text-white font-semibold text-[13px] hover:bg-black/80 transition-colors disabled:opacity-50"
                        >
                            Assign
                        </button>
                    </div>
                </div>

                {error && <p className="text-[12px] text-red-600 mt-1 w-full">{error}</p>}
                {successMessage && <p className="text-[12px] text-[#059669] mt-1 w-full bg-[#059669]/10 py-1.5 px-3 rounded-lg font-medium">{successMessage}</p>}
            </div>
        </div>
    )
}
