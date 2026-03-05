'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CanvasConnection, CanvasColor, StudioCanvasEntry } from '../types/studio.types'

const NODE_W = 160
const NODE_H = 72

const COLOR_DOT: Record<CanvasColor, string> = {
    default: 'bg-black/15',
    yellow: 'bg-amber-400',
    blue: 'bg-blue-400',
    green: 'bg-emerald-400',
    purple: 'bg-purple-400',
    red: 'bg-rose-400',
}

const COLOR_BORDER: Record<CanvasColor, string> = {
    default: 'border-black/10',
    yellow: 'border-amber-200',
    blue: 'border-blue-200',
    green: 'border-emerald-200',
    purple: 'border-purple-200',
    red: 'border-rose-200',
}

function autoPosition(entries: StudioCanvasEntry[]) {
    // Place unpositioned nodes in a grid
    const cols = Math.ceil(Math.sqrt(entries.length))
    const gap = 220
    return entries.map((e, i) => ({
        id: e.id,
        x: e.web_x ?? (i % cols) * gap + 80,
        y: e.web_y ?? Math.floor(i / cols) * (NODE_H + gap * 0.6) + 80,
    }))
}

interface Props {
    entries: StudioCanvasEntry[]
    connections: CanvasConnection[]
    onNodeClick: (entry: StudioCanvasEntry) => void
    onCreateConnection: (fromId: string, toId: string) => void
    onDeleteConnection: (id: string) => void
    onUpdatePosition: (id: string, x: number, y: number) => void
    onDeleteNode: (id: string) => void
    onArchiveNode: (id: string) => void
}

export default function CanvasWebView({
    entries, connections, onNodeClick, onCreateConnection, onDeleteConnection, onUpdatePosition,
    onDeleteNode, onArchiveNode
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [pan, setPan] = useState({ x: 60, y: 60 })
    const [zoom, setZoom] = useState(1)
    const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
    const [pendingLine, setPendingLine] = useState<{ x: number; y: number } | null>(null)
    const [hoveredNode, setHoveredNode] = useState<string | null>(null)
    const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)
    const dragStart = useRef<{ mx: number; my: number; nx: number; ny: number } | null>(null)
    const panStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
    const isPanning = useRef(false)

    // Initialise positions from persisted data + auto-layout for unpositioned
    useEffect(() => {
        const autoPos = autoPosition(entries)
        const next: Record<string, { x: number; y: number }> = {}
        autoPos.forEach(p => { next[p.id] = { x: p.x, y: p.y } })
        setPositions(prev => {
            const merged = { ...prev }
            Object.entries(next).forEach(([id, pos]) => {
                if (!merged[id]) merged[id] = pos
            })
            return merged
        })
    }, [entries])

    const getPos = (id: string) => positions[id] ?? { x: 80, y: 80 }

    // ---- Zoom ----
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault()
        setZoom(z => Math.max(0.3, Math.min(2.5, z - e.deltaY * 0.001)))
    }, [])

    // ---- Pan (background drag) ----
    const onBgMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return
        if ((e.target as HTMLElement).closest('[data-node]')) return
        isPanning.current = true
        panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
    }

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (draggingId && dragStart.current) {
            const dx = (e.clientX - dragStart.current.mx) / zoom
            const dy = (e.clientY - dragStart.current.my) / zoom
            const nx = dragStart.current.nx + dx
            const ny = dragStart.current.ny + dy
            setPositions(prev => ({ ...prev, [draggingId]: { x: nx, y: ny } }))
        } else if (isPanning.current && panStart.current) {
            setPan({
                x: panStart.current.px + (e.clientX - panStart.current.mx),
                y: panStart.current.py + (e.clientY - panStart.current.my),
            })
        }

        if (connectingFrom) {
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
                setPendingLine({
                    x: (e.clientX - rect.left - pan.x) / zoom,
                    y: (e.clientY - rect.top - pan.y) / zoom,
                })
            }
        }
    }, [draggingId, zoom, connectingFrom, pan])

    const onMouseUp = useCallback((e: React.MouseEvent) => {
        if (draggingId) {
            const pos = positions[draggingId]
            if (pos) onUpdatePosition(draggingId, pos.x, pos.y)
        }
        setDraggingId(null)
        dragStart.current = null
        isPanning.current = false
        panStart.current = null
    }, [draggingId, positions, onUpdatePosition])

    // ---- Node interaction ----
    const onNodeMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (connectingFrom) return
        setDraggingId(id)
        const pos = getPos(id)
        dragStart.current = { mx: e.clientX, my: e.clientY, nx: pos.x, ny: pos.y }
    }

    const handleNodeClick = (e: React.MouseEvent, entry: StudioCanvasEntry) => {
        e.stopPropagation()
        if (draggingId) return
        if (connectingFrom) {
            if (connectingFrom !== entry.id) {
                onCreateConnection(connectingFrom, entry.id)
            }
            setConnectingFrom(null)
            setPendingLine(null)
            return
        }
        onNodeClick(entry)
    }

    const startConnect = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setConnectingFrom(id)
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
            setPendingLine({
                x: (e.clientX - rect.left - pan.x) / zoom,
                y: (e.clientY - rect.top - pan.y) / zoom,
            })
        }
    }

    const cancelConnect = () => {
        setConnectingFrom(null)
        setPendingLine(null)
    }

    // ---- Auto-arrange ----
    const autoArrange = () => {
        const next: Record<string, { x: number; y: number }> = {}
        autoPosition(entries.map(e => ({ ...e, web_x: null, web_y: null }))).forEach(p => {
            next[p.id] = { x: p.x, y: p.y }
        })
        setPositions(next)
        entries.forEach(e => {
            const p = next[e.id]
            if (p) onUpdatePosition(e.id, p.x, p.y)
        })
    }

    // ---- Edge bezier path ----
    const edgePath = (fromId: string, toId: string) => {
        const a = getPos(fromId)
        const b = getPos(toId)
        const ax = a.x + NODE_W / 2, ay = a.y + NODE_H / 2
        const bx = b.x + NODE_W / 2, by = b.y + NODE_H / 2
        const cx = (ax + bx) / 2
        return `M ${ax} ${ay} C ${cx} ${ay}, ${cx} ${by}, ${bx} ${by}`
    }

    const pendingPath = (fromId: string) => {
        if (!pendingLine) return ''
        const a = getPos(fromId)
        const ax = a.x + NODE_W / 2, ay = a.y + NODE_H / 2
        const cx = (ax + pendingLine.x) / 2
        return `M ${ax} ${ay} C ${cx} ${ay}, ${cx} ${pendingLine.y}, ${pendingLine.x} ${pendingLine.y}`
    }

    return (
        <div className="relative w-full flex-1 bg-[#f7f7f7] overflow-hidden select-none"
            style={{ backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)', backgroundSize: '28px 28px' }}
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={onBgMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={connectingFrom ? cancelConnect : undefined}
        >
            {/* Controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))} className="w-8 h-8 bg-white border border-black/[0.08] rounded-xl flex items-center justify-center text-black/40 hover:text-black/70 shadow-sm transition-all">
                    <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="w-8 h-8 bg-white border border-black/[0.08] rounded-xl flex items-center justify-center text-black/40 hover:text-black/70 shadow-sm transition-all">
                    <ZoomOut className="w-4 h-4" />
                </button>
                <button onClick={() => { setPan({ x: 60, y: 60 }); setZoom(1) }} className="w-8 h-8 bg-white border border-black/[0.08] rounded-xl flex items-center justify-center text-black/40 hover:text-black/70 shadow-sm transition-all">
                    <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={autoArrange} className="w-8 h-8 bg-white border border-black/[0.08] rounded-xl flex items-center justify-center text-black/40 hover:text-black/70 shadow-sm transition-all" title="Auto-arrange">
                    <Shuffle className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Status hint */}
            {connectingFrom && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-black text-white text-[11px] font-bold rounded-xl shadow-xl animate-in fade-in duration-150">
                    Click another idea to connect · Esc to cancel
                </div>
            )}

            {/* Zoom/Pan container */}
            <div
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', width: '100%', height: '100%' }}
            >
                {/* SVG edges layer */}
                <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: '100%', height: '100%' }}>
                    {/* Existing connections */}
                    {connections.map(conn => (
                        <g key={conn.id}>
                            {/* Wider hit area */}
                            <path
                                d={edgePath(conn.from_id, conn.to_id)}
                                stroke="transparent"
                                strokeWidth={14}
                                fill="none"
                                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredEdge(conn.id)}
                                onMouseLeave={() => setHoveredEdge(null)}
                                onClick={(e) => { e.stopPropagation(); onDeleteConnection(conn.id) }}
                            />
                            <path
                                d={edgePath(conn.from_id, conn.to_id)}
                                stroke={hoveredEdge === conn.id ? '#ef4444' : '#9ca3af'}
                                strokeWidth={hoveredEdge === conn.id ? 2 : 1.5}
                                strokeDasharray={hoveredEdge === conn.id ? '4 3' : undefined}
                                fill="none"
                                opacity={0.7}
                                style={{ pointerEvents: 'none' }}
                            />
                        </g>
                    ))}
                    {/* Pending (in-progress) connection */}
                    {connectingFrom && pendingLine && (
                        <path
                            d={pendingPath(connectingFrom)}
                            stroke="#6366f1"
                            strokeWidth={1.5}
                            strokeDasharray="5 4"
                            fill="none"
                            opacity={0.8}
                            style={{ pointerEvents: 'none' }}
                        />
                    )}
                </svg>

                {/* Nodes */}
                {entries.map(entry => {
                    const pos = getPos(entry.id)
                    const isConnecting = connectingFrom === entry.id
                    const isHovered = hoveredNode === entry.id
                    const connCount = connections.filter(c => c.from_id === entry.id || c.to_id === entry.id).length

                    return (
                        <div
                            key={entry.id}
                            data-node="1"
                            style={{ position: 'absolute', left: pos.x, top: pos.y, width: NODE_W }}
                            onMouseEnter={() => setHoveredNode(entry.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            onMouseDown={e => onNodeMouseDown(e, entry.id)}
                            onClick={e => handleNodeClick(e, entry)}
                        >
                            <div className={cn(
                                "bg-white border rounded-2xl px-3.5 py-3 shadow-sm cursor-grab active:cursor-grabbing transition-all duration-150",
                                COLOR_BORDER[entry.color],
                                draggingId === entry.id && 'shadow-2xl ring-2 ring-black/10 scale-110 rotate-1 z-[100] cursor-grabbing',
                                isConnecting && 'ring-2 ring-indigo-400 shadow-md',
                                isHovered && !isConnecting && draggingId !== entry.id && 'shadow-md',
                                connectingFrom && connectingFrom !== entry.id && 'hover:ring-2 hover:ring-indigo-300'
                            )}
                                style={{ height: NODE_H }}
                            >
                                <div className="flex items-start gap-2 h-full">
                                    <div className={cn("w-2 h-2 rounded-full mt-0.5 shrink-0", COLOR_DOT[entry.color])} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-black leading-snug line-clamp-2">{entry.title}</p>
                                        {connCount > 0 && (
                                            <p className="text-[9px] text-black/30 font-medium mt-1">{connCount} link{connCount !== 1 ? 's' : ''}</p>
                                        )}
                                    </div>
                                    {/* Image thumbnail */}
                                    {entry.images && entry.images.length > 0 && (
                                        <img src={entry.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-black/[0.06]" />
                                    )}
                                </div>
                            </div>

                            {/* Hover actions: connect + archive + delete */}
                            {isHovered && !connectingFrom && draggingId !== entry.id && (
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10" onClick={e => e.stopPropagation()}>
                                    <button onClick={e => startConnect(e, entry.id)} className="px-2 py-1 bg-indigo-500 text-white text-[9px] font-black rounded-lg shadow-md hover:bg-indigo-600 transition-all whitespace-nowrap" onMouseDown={e => e.stopPropagation()}>+ Connect</button>
                                    <button onClick={e => { e.stopPropagation(); onArchiveNode(entry.id) }} className="w-5 h-5 bg-amber-50 text-amber-500 rounded-md flex items-center justify-center hover:bg-amber-100 transition-all text-[10px]" title="Archive" onMouseDown={e => e.stopPropagation()}>▿</button>
                                    <button onClick={e => { e.stopPropagation(); onDeleteNode(entry.id) }} className="w-5 h-5 bg-red-50 text-red-500 rounded-md flex items-center justify-center hover:bg-red-100 transition-all text-[10px]" title="Delete" onMouseDown={e => e.stopPropagation()}>✕</button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Empty state */}
            {entries.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-[13px] text-black/20 font-medium">Add ideas in Board view to see them here</p>
                </div>
            )}
        </div>
    )
}
