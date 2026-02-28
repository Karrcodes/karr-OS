'use client'

import { Shield, ExternalLink, Calendar, Award, CheckCircle2, Plus } from 'lucide-react'

import { useStudio } from '@/features/studio/hooks/useStudio'
import Link from 'next/link'
import { KarrFooter } from '@/components/KarrFooter'

export default function PortfolioPage() {
    const { projects, press } = useStudio()

    const portfolioProjects = projects.filter(p => p.gtv_featured)
    const portfolioPress = press.filter(p => p.is_portfolio_item && (p.status === 'achieved' || p.status === 'published'))

    const evidenceCount = portfolioProjects.length + portfolioPress.length

    // Helper to filter evidence by predefined categories
    const getEvidenceCount = (categoryStr: string) => {
        const cat = categoryStr.toLowerCase()
        const pCount = portfolioPress.filter(p => p.gtv_category === cat).length
        // Assign gtv_featured projects to 'innovation' by default for now
        const prjCount = cat === 'innovation' ? portfolioProjects.length : 0
        return pCount + prjCount
    }
    return (
        <main className="min-h-screen bg-[#FAFAFA] pb-24 pt-4 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* GTV Status Header */}
                <div className="p-8 rounded-[40px] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                        <Shield className="w-64 h-64" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-400/20 w-fit text-blue-200 border border-blue-400/20 text-[10px] font-bold uppercase tracking-widest">
                                <Shield className="w-3 h-3" />
                                GTV Portfolio Mode
                            </div>
                            <h1 className="text-4xl font-black tracking-tight leading-none">Global Talent Visa<br /><span className="text-blue-300/80">Evidence Evidence Storage</span></h1>
                            <p className="text-[14px] font-medium text-blue-200/60 max-w-xl">
                                Your curated evidence for the September 2026 application. Everything here represents your case for Exceptional Promise under Tech Nation's Digital Technology criteria.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Application Target</p>
                                <div className="flex items-center gap-2 text-xl font-bold">
                                    <Calendar className="w-5 h-5 text-blue-400" />
                                    Sept 2026
                                </div>
                            </div>
                            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Evidence Count</p>
                                <div className="flex items-center gap-2 text-xl font-bold">
                                    <Award className="w-5 h-5 text-blue-400" />
                                    {evidenceCount} / 10
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Portfolio Sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['Innovation', 'Impact', 'Recognition'].map(category => (
                        <div key={category} className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-[12px] font-black text-black/40 uppercase tracking-[0.2em]">{category}</h2>
                                <span className="text-[11px] font-bold text-black/20">{getEvidenceCount(category)} pieces</span>
                            </div>
                            <div className="aspect-[3/4] rounded-[32px] bg-white border border-black/[0.05] p-8 flex flex-col items-center justify-center text-center group hover:border-blue-200 transition-all cursor-pointer">
                                <div className="w-16 h-16 rounded-full bg-black/[0.02] border-2 border-dashed border-black/[0.05] flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                                    <Plus className="w-8 h-8 text-black/10 group-hover:text-blue-400" />
                                </div>
                                <h3 className="text-[13px] font-bold text-black/30">Add {category} Evidence</h3>
                                <p className="text-[11px] text-black/20 mt-2">Tag active projects as 'gtv_featured' to curate your portfolio.</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Resources */}
                <div className="p-6 rounded-3xl bg-blue-50 border border-blue-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-[14px] font-black text-blue-900">Tech Nation Guidelines</h4>
                            <p className="text-[12px] font-medium text-blue-800/60">Review the official criteria for Exceptional Promise endorsement.</p>
                        </div>
                    </div>
                    <a
                        href="https://technation.io/visa/digital-technology-exceptional-promise-criteria/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-2xl text-[12px] font-bold hover:bg-blue-800 transition-all"
                    >
                        View Official Guide
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
            <KarrFooter />
        </main>
    )
}
