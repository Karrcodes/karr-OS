'use client'

import React from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts'
import { useWellbeing } from '../contexts/WellbeingContext'
import { format, parseISO } from 'date-fns'

export function WeightChart() {
    const { weightHistory, profile } = useWellbeing()

    if (weightHistory.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center bg-black/[0.02] rounded-3xl border border-black/5">
                <p className="text-[11px] font-black text-black/20 uppercase tracking-[0.2em]">No weight history recorded</p>
            </div>
        )
    }

    // Sort history by date and format for Recharts
    const data = [...weightHistory]
        .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
        .map(entry => ({
            ...entry,
            formattedDate: format(parseISO(entry.date), 'MMM d')
        }))

    const weights = data.map(d => d.weight)
    if (profile?.goalWeight) {
        weights.push(profile.goalWeight)
    }
    const minWeight = Math.floor(Math.min(...weights) - 2)
    const maxWeight = Math.ceil(Math.max(...weights) + 2)

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis
                        dataKey="formattedDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: 'rgba(0,0,0,0.3)' }}
                        dy={10}
                    />
                    <YAxis
                        domain={[minWeight, maxWeight]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: 'rgba(0,0,0,0.3)' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'black',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                        }}
                        itemStyle={{ color: 'white', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}
                    />
                    {profile?.goalWeight && (
                        <ReferenceLine 
                            y={profile.goalWeight} 
                            stroke="#000" 
                            strokeDasharray="3 3" 
                            strokeOpacity={0.2}
                            label={{ position: 'insideBottomLeft', value: 'GOAL', fill: 'rgba(0,0,0,0.3)', fontSize: 10, fontWeight: 900, dx: 10, dy: -5 }} 
                        />
                    )}
                    <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#f43f5e"
                        strokeWidth={4}
                        dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
