import { FinanceProfileProvider } from '@/features/finance/contexts/FinanceProfileContext'
import { LiabilitiesManager } from '@/features/finance/components/LiabilitiesManager'

export default function LiabilitiesPage() {
    return (
        <FinanceProfileProvider>
            <div className="h-screen bg-[#fafafa] dark:bg-[#050505] flex flex-col overflow-hidden">
                <div className="bg-white dark:bg-[#0a0a0a] border-b border-black/[0.06] dark:border-white/[0.06] px-6 py-5 z-20 shadow-sm flex-shrink-0">
                    <div className="max-w-5xl mx-auto space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-[20px] font-bold text-black dark:text-white tracking-tight">Liabilities</h1>
                                <p className="text-[12px] text-black/35 mt-0.5">Manage recurring debt and subscription schedules</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-5xl mx-auto">
                        <LiabilitiesManager />
                    </div>
                </div>
            </div>
        </FinanceProfileProvider>
    )
}
