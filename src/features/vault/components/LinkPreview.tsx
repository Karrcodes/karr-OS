'use client'

import React, { useState, useEffect } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LinkPreviewData {
    title: string
    description: string
    image: string | null
    siteName: string
    url: string
}

export function LinkPreview({ url }: { url: string }) {
    const [data, setData] = useState<LinkPreviewData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                setLoading(true)
                const res = await fetch(`/api/vault/preview?url=${encodeURIComponent(url)}`)
                if (!res.ok) throw new Error()
                const json = await res.json()
                setData(json)
            } catch (err) {
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchPreview()
    }, [url])

    if (loading) {
        return (
            <div className="mt-3 bg-black/[0.02] border border-black/[0.04] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-black/[0.02]" />
                <div className="p-3 space-y-2">
                    <div className="h-4 bg-black/[0.04] rounded w-3/4" />
                    <div className="h-3 bg-black/[0.02] rounded w-full" />
                </div>
            </div>
        )
    }

    if (error || !data) return null

    const isVideo = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex bg-white border border-black/[0.08] rounded-xl overflow-hidden hover:border-black/20 hover:shadow-lg hover:shadow-black/5 transition-all group"
        >
            {data.image && (
                <div className="relative w-24 xs:w-32 aspect-square xs:aspect-video bg-black/[0.02] overflow-hidden shrink-0 border-r border-black/[0.04]">
                    <img
                        src={data.image}
                        alt={data.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                <Play className="w-3 h-3 text-black fill-current ml-0.5" />
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className="p-2.5 flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest truncate">{data.siteName}</p>
                <h4 className="text-[12px] font-bold text-black line-clamp-1 mb-0.5">{data.title}</h4>
                {data.description && (
                    <p className="text-[10px] text-black/50 line-clamp-1 leading-relaxed">
                        {data.description}
                    </p>
                )}
            </div>
            <div className="p-2.5 flex items-center justify-center text-black/10 group-hover:text-black/30 transition-colors shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
            </div>
        </a>
    )
}
