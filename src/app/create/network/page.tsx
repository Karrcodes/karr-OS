'use client'

import { Activity, Plus, Search, Users, Globe, MapPin } from 'lucide-react'

export default function NetworkPage() {
    return (
        <main className="min-h-screen bg-[#FAFAFA] pb-24 pt-4 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-black tracking-tight">Creative Network</h1>
                        <p className="text-[13px] text-black/40 font-medium">Track people, communities, and events that inspire your journey.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-[12px] font-bold hover:scale-105 transition-transform shadow-lg shadow-black/10">
                            <Plus className="w-4 h-4" />
                            Add Contact / Event
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-black/[0.05] overflow-x-auto pb-1">
                    <button className="flex items-center gap-2 px-2 py-3 border-b-2 border-orange-500 text-[13px] font-bold text-black whitespace-nowrap">
                        <Users className="w-4 h-4 text-orange-500" />
                        People
                    </button>
                    <button className="flex items-center gap-2 px-2 py-3 border-b-2 border-transparent text-[13px] font-bold text-black/40 hover:text-black/60 transition-all whitespace-nowrap">
                        <Globe className="w-4 h-4" />
                        Communities
                    </button>
                    <button className="flex items-center gap-2 px-2 py-3 border-b-2 border-transparent text-[13px] font-bold text-black/40 hover:text-black/60 transition-all whitespace-nowrap">
                        <MapPin className="w-4 h-4" />
                        Events
                    </button>
                </div>

                {/* Network List Placeholder */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[400px]">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-8 rounded-3xl bg-black/[0.015] border-2 border-dashed border-black/[0.03] flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-black/[0.03] flex items-center justify-center mb-4">
                                <Activity className="w-6 h-6 text-black/10" />
                            </div>
                            <p className="text-[12px] font-bold text-black/10 italic">No network entries in this category</p>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
