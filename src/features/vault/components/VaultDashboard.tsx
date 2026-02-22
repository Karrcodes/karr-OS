'use client'

import React from 'react'
import { Shield } from 'lucide-react'
import { Clipboard } from './Clipboard'

export function VaultDashboard() {
    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-black/[0.06] px-6 py-4">
                <div className="flex items-center gap-3 max-w-5xl mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-lg shadow-black/10">
                        <Shield className="w-5 h-4" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-black tracking-tight">Vault</h1>
                        <p className="text-[12px] text-black/40 font-medium">Secure Cross-Device Storage</p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 pt-8 space-y-8">
                {/* Clipboard Section */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-black flex items-center gap-2">
                            <span>📋</span> Clipboard
                        </h2>
                        <p className="text-[12px] text-black/40">Instantly share text and links between your devices</p>
                    </div>

                    <Clipboard />
                </section>

                {/* Other Vault features can go here in the future */}
                <div className="pt-8 border-t border-black/[0.06]">
                    <p className="text-[11px] text-center text-black/20 font-medium uppercase tracking-widest">
                        End-to-End Encryption Logic Pending
                    </p>
                </div>
            </main>
        </div>
    )
}
