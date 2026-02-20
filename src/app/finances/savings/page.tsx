import { FinanceProfileProvider } from '@/features/finance/contexts/FinanceProfileContext'
import { SavingsManager } from '@/features/finance/components/SavingsManager'

export default function SavingsPage() {
    return (
        <FinanceProfileProvider>
            <div className="h-screen bg-[#fafafa] dark:bg-[#050505] flex flex-col overflow-hidden">
                <div className="bg-white dark:bg-[#0a0a0a] border-b border-black/[0.06] dark:border-white/[0.06] px-6 py-5 z-20 shadow-sm flex-shrink-0">
                    <div className="max-w-5xl mx-auto space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-[20px] font-bold text-black dark:text-white tracking-tight">Savings Goals</h1>
                                <p className="text-[12px] text-black/35 mt-0.5">Define long-term targets and regular allocations</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-5xl mx-auto">
                        <SavingsManager />
                    </div>
                </div>
            </div>
        </FinanceProfileProvider>
    )
}
