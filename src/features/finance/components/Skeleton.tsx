'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
    className?: string
    width?: string | number
    height?: string | number
    show?: boolean
    children?: React.ReactNode
    as?: React.ElementType
}

export function Skeleton({ className, width, height, show = false, children, as: Component = 'div' }: SkeletonProps) {
    if (!show) return <>{children}</>

    return (
        <Component
            className={cn("skeleton-shimmer", className)}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                minWidth: typeof width === 'number' ? `${width}px` : width,
                minHeight: typeof height === 'number' ? `${height}px` : height,
            }}
        >
            {children}
        </Component>
    )
}
