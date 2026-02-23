import { ProjectionsAnalytics } from '@/features/finance/components/ProjectionsAnalytics'
import { FinanceProfileProvider } from '@/features/finance/contexts/FinanceProfileContext'
import { KarrFooter } from '@/components/KarrFooter'

export default function ProjectionsPage() {
    return (
        <FinanceProfileProvider>
            <div className="h-screen bg-[#fafafa] flex flex-col overflow-hidden">
                <div className="bg-white border-b border-black/[0.06] px-6 py-5 z-20 shadow-sm flex-shrink-0">
                    <div className="max-w-5xl mx-auto space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-[20px] font-bold text-black tracking-tight">Earnings Projections</h1>
                                <p className="text-[12px] text-black/35 mt-0.5">Rota schedule, weekly paydays, and overtime estimates</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <ProjectionsAnalytics />
                    </div>
                    <KarrFooter dark />
                </div>
            </div>
        </FinanceProfileProvider>
    )
}
