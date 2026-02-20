import { FinanceProfileProvider, useFinanceProfile } from '@/features/finance/contexts/FinanceProfileContext'
import { LiabilitiesManager } from '@/features/finance/components/LiabilitiesManager'

function LiabilitiesPage() {
    const { activeProfile, setProfile } = useFinanceProfile()

    return (
        <div className="h-screen bg-[#fafafa] flex flex-col overflow-hidden">
            <div className="bg-white border-b border-black/[0.06] px-6 py-5 z-20 shadow-sm flex-shrink-0">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[20px] font-bold text-black tracking-tight">Liabilities</h1>
                        <p className="text-[12px] text-black/35 mt-0.5">
                            Manage recurring debt and subscription schedules · {activeProfile === 'personal' ? 'Personal' : 'Studio Karrtesian'}
                        </p>
                    </div>
                    <div className="flex bg-black/[0.04] p-1 rounded-xl border border-black/[0.06] w-fit">
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
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">
                    <LiabilitiesManager />
                </div>
            </div>
        </div>
    )
}

export default function LiabilitiesPageWrapper() {
    return (
        <FinanceProfileProvider>
            <LiabilitiesPage />
        </FinanceProfileProvider>
    )
}
