'use client'

import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
    content: string | React.ReactNode
    side?: 'top' | 'bottom' | 'left' | 'right'
}

export function InfoTooltip({ content, side = 'top' }: InfoTooltipProps) {
    const [visible, setVisible] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setVisible(false)
            }
        }
        if (visible) document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [visible])

    const positionClasses: Record<string, string> = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    }

    const arrowClasses: Record<string, string> = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-[#1c1c1e] border-l-transparent border-r-transparent border-b-transparent',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#1c1c1e] border-l-transparent border-r-transparent border-t-transparent',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-[#1c1c1e] border-t-transparent border-b-transparent border-r-transparent',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-[#1c1c1e] border-t-transparent border-b-transparent border-l-transparent',
    }

    return (
        <div ref={ref} className="relative inline-flex items-center">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setVisible(v => !v) }}
                className="w-4 h-4 rounded-full flex items-center justify-center text-black/25 hover:text-[#7c3aed] hover:bg-[#7c3aed]/10 transition-all"
                aria-label="More information"
            >
                <Info className="w-3 h-3" />
            </button>

            {visible && (
                <div className={`absolute z-50 w-64 ${positionClasses[side]}`}>
                    <div className="bg-[#1c1c1e] text-white text-[12px] leading-relaxed p-3 rounded-xl shadow-xl">
                        {content}
                    </div>
                    <div className={`absolute w-0 h-0 border-4 ${arrowClasses[side]}`} />
                </div>
            )}
        </div>
    )
}
