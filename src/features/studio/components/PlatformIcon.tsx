'use client'

import React from 'react'
import { Youtube, Instagram, Globe } from 'lucide-react'
import type { Platform } from '../types/studio.types'

interface PlatformIconProps {
    platform: Platform
    className?: string
}

export default function PlatformIcon({ platform, className }: PlatformIconProps) {
    switch (platform) {
        case 'youtube': return <Youtube className={className} />
        case 'instagram': return <Instagram className={className} />
        case 'substack': return <SubstackIcon className={className} />
        case 'tiktok': return <TikTokIcon className={className} />
        case 'x': return <XIcon className={className} />
        case 'web': return <Globe className={className} />
        default: return null
    }
}

function SubstackIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M22.532 10.561H1.468v-1.228h21.064v1.228zm0 4.962H1.468v-1.227h21.064v1.227zM12 21.328L1.468 15.523v1.227L12 22.555l10.532-5.805v-1.227L12 21.328zM1.468 5.596v1.228h21.064V5.596H1.468z" />
        </svg>
    )
}

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.28-2.26.74-4.63 2.58-5.91 1.64-1.15 3.7-1.49 5.66-1.02V10.3c-1.03-.43-2.26-.22-3.11.52-.91.71-1.26 1.96-1.03 3.08.18 1.05.9 2.05 1.93 2.4.51.2 1.07.31 1.61.28.36-.03.71-.12 1.05-.28 1.11-.53 1.74-1.78 1.69-3.01-.01-4.07-.02-8.15-.02-12.23.01-.1.04-.2.03-.3z" />
        </svg>
    )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
        </svg>
    )
}
