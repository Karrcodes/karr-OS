import React, { useState } from 'react'
import { Shield, Clipboard as ClipboardIcon, Key, Lock } from 'lucide-react'
import { Clipboard } from './Clipboard'
import { SecretsManager } from './SecretsManager'
import { KarrFooter } from '@/components/KarrFooter'

type VaultTab = 'clipboard' | 'secrets'

export function VaultDashboard() {
    const [activeTab, setActiveTab] = useState<VaultTab>('clipboard')

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col w-full overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-black/[0.06] px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-5xl mx-auto gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-lg shadow-black/10 shrink-0">
                            <Shield className="w-4 h-3.5 sm:w-5 sm:h-4" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold text-black tracking-tight leading-tight">Vault</h1>
                            <p className="text-[11px] sm:text-[12px] text-black/40 font-medium truncate">Secure Cross-Device Storage</p>
                        </div>
                    </div>

                    {/* Sub-navigation Tabs */}
                    <div className="flex bg-black/[0.03] p-1 rounded-xl border border-black/[0.05] items-center w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('clipboard')}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-bold transition-all ${activeTab === 'clipboard'
                                ? 'bg-white text-black shadow-sm ring-1 ring-black/[0.02]'
                                : 'text-black/40 hover:text-black/60 hover:bg-black/[0.02]'
                                }`}
                        >
                            <ClipboardIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Clipboard</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('secrets')}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-bold transition-all ${activeTab === 'secrets'
                                ? 'bg-white text-black shadow-sm ring-1 ring-black/[0.02]'
                                : 'text-black/40 hover:text-black/60 hover:bg-black/[0.02]'
                                }`}
                        >
                            <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Secrets</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-20 flex-1">
                {activeTab === 'clipboard' ? (
                    <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-black flex items-center gap-2">
                                <span>📋</span> Clipboard
                            </h2>
                            <p className="text-[12px] text-black/40 font-medium">Instantly share text and links between your devices</p>
                        </div>
                        <Clipboard />
                    </section>
                ) : (
                    <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <SecretsManager />
                    </section>
                )}

                {/* Security Note */}
                <div className="mt-16 pt-8 border-t border-black/[0.06] flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black/[0.03] flex items-center justify-center">
                        <Lock className="w-4 h-4 text-black/20" />
                    </div>
                    <p className="text-[11px] text-center text-black/20 font-bold uppercase tracking-widest max-w-xs leading-relaxed">
                        End-to-End Encryption Logic Pending <br />
                        Data is currently stored in secure database
                    </p>
                </div>
            </main>

            <KarrFooter />
        </div>
    )
}
