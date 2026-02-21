'use client'

import { LayoutDashboard } from 'lucide-react'
import { KarrFooter } from '@/components/KarrFooter'

export default function ControlCentrePage() {
    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col">
            <div className="bg-white border-b border-black/[0.06] px-6 py-5 z-20 shadow-sm shrink-0">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <div>
                        <h1 className="text-[20px] font-bold text-black tracking-tight flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-black" />
                            Control Centre
                        </h1>
                        <p className="text-[12px] text-black/35 mt-0.5">Manage your system settings and modules</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                <div className="max-w-5xl mx-auto w-full flex-1 mb-8">
                    <div className="rounded-2xl border border-black/[0.08] bg-white p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                        <div className="w-16 h-16 rounded-full bg-black/[0.03] border border-black/[0.05] flex items-center justify-center mb-4">
                            <LayoutDashboard className="w-8 h-8 text-black/20" />
                        </div>
                        <h2 className="text-[18px] font-bold text-black tracking-tight">System Control Centre</h2>
                        <p className="text-[14px] text-black/40 mt-2 max-w-sm">
                            Basic functionality will be built here next. Check back soon.
                        </p>
                    </div>
                </div>
                <KarrFooter />
            </div>
        </div>
    )
}
