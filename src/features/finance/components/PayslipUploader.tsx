'use client'

import { useRef, useState } from 'react'
import { UploadCloud, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { usePayslips } from '../hooks/usePayslips'
import { useIncome } from '../hooks/useIncome'

interface PayslipUploaderProps {
    onSuccess?: () => void
}

interface UploadResult {
    file: string
    status: 'ok' | 'error'
    message?: string
}

export function PayslipUploader({ onSuccess }: PayslipUploaderProps) {
    const { logPayslip } = usePayslips()
    const { logIncome } = useIncome()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [results, setResults] = useState<UploadResult[]>([])

    const processFiles = async (files: File[]) => {
        if (files.length === 0) return

        setUploading(true)
        setResults([])

        const newResults: UploadResult[] = []

        for (const file of files) {
            // Validate file type upfront
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
            if (!validTypes.includes(file.type)) {
                newResults.push({ file: file.name, status: 'error', message: 'Unsupported file type' })
                continue
            }

            const formData = new FormData()
            formData.append('file', file)

            try {
                const res = await fetch('/api/ai/payslip', { method: 'POST', body: formData })
                const data = await res.json()

                if (!res.ok || data.error) {
                    newResults.push({ file: file.name, status: 'error', message: data.error || 'API error' })
                    continue
                }

                if (!data.netPay || !data.date) {
                    newResults.push({ file: file.name, status: 'error', message: 'Could not extract pay/date from payslip' })
                    continue
                }

                await Promise.all([
                    logIncome({ amount: parseFloat(data.netPay), source: data.employer || 'Salary', date: data.date }),
                    logPayslip({
                        date: data.date,
                        employer: data.employer || 'Salary',
                        net_pay: parseFloat(data.netPay),
                        gross_pay: data.grossPay ? parseFloat(data.grossPay) : null,
                        tax_paid: data.tax ? parseFloat(data.tax) : null,
                        pension_contributions: data.pension ? parseFloat(data.pension) : null,
                        student_loan: data.studentLoan ? parseFloat(data.studentLoan) : null,
                    })
                ])

                newResults.push({ file: file.name, status: 'ok', message: `£${parseFloat(data.netPay).toFixed(2)} net · ${data.date}` })
            } catch (err: any) {
                newResults.push({ file: file.name, status: 'error', message: err.message || 'Unknown error' })
            }
        }

        setUploading(false)
        setResults(newResults)
        if (fileInputRef.current) fileInputRef.current.value = ''

        const anyOk = newResults.some(r => r.status === 'ok')
        if (anyOk && onSuccess) onSuccess()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(Array.from(e.target.files || []))
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        processFiles(Array.from(e.dataTransfer.files))
    }

    return (
        <div className="bg-white rounded-3xl border border-black/[0.06] shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-black">Upload Payslips</h3>
                <span className="text-[10px] font-bold text-black/30 uppercase tracking-wider">AI Extraction</span>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleInputChange}
            />

            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`
                    relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed 
                    cursor-pointer transition-all duration-200
                    ${dragging ? 'border-black/60 dark:border-white/60 bg-black/5 dark:bg-white/5 scale-[1.01]' : 'border-black/10 hover:border-black/40 dark:border-white/40 hover:bg-black dark:bg-white/[0.02]'}
                    ${uploading ? 'pointer-events-none opacity-70' : ''}
                `}
            >
                {uploading ? (
                    <>
                        <Loader2 className="w-8 h-8 text-black dark:text-white animate-spin" />
                        <p className="text-[13px] font-bold text-black dark:text-white">Parsing with AI...</p>
                        <p className="text-[11px] text-black/30">This may take a moment</p>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 rounded-2xl bg-black/10 dark:bg-white/10 flex items-center justify-center">
                            <UploadCloud className="w-6 h-6 text-black dark:text-white" />
                        </div>
                        <div className="text-center">
                            <p className="text-[14px] font-bold text-black">Drop payslips here or click to upload</p>
                            <p className="text-[12px] text-black/30 mt-1">Supports JPG, PNG, PDF · Multiple files for batch import</p>
                        </div>
                    </>
                )}
            </div>

            {results.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Import Results</p>
                        <button onClick={() => setResults([])} className="text-[10px] text-black/25 hover:text-black/50 transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {results.map((r, i) => (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${r.status === 'ok' ? 'bg-[#059669]/5 border-[#059669]/20' : 'bg-red-50 border-red-100'}`}>
                            {r.status === 'ok'
                                ? <CheckCircle className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" />
                                : <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-black truncate">{r.file}</p>
                                <p className={`text-[11px] mt-0.5 ${r.status === 'ok' ? 'text-[#059669]/70' : 'text-red-500'}`}>{r.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-[11px] text-black/25 italic">
                Your payslip data is processed securely and never stored externally.
            </p>
        </div>
    )
}
