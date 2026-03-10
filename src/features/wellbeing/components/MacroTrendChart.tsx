'use client'

import React, { useMemo } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'
import { useWellbeing } from '../contexts/WellbeingContext'
import { format, subDays, parseISO, isSameDay } from 'date-fns'

export function MacroTrendChart() {
    const { mealLogs, macros } = useWellbeing()

    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(new Date(), i)
            const dateStr = format(date, 'yyyy-MM-dd')

            const dayMeals = mealLogs.filter(m => m.date === dateStr)
            const totals = dayMeals.reduce((acc, meal) => ({
                calories: acc.calories + meal.calories,
                protein: acc.protein + meal.protein,
                fat: acc.fat + meal.fat,
                carbs: acc.carbs + meal.carbs
            }), { calories: 0, protein: 0, fat: 0, carbs: 0 })

            return {
                date: dateStr,
                displayDate: format(date, 'EEE'),
                ...totals,
                targetCalories: macros.calories
            }
        }).reverse()

        return last7Days
    }, [mealLogs, macros])

    if (mealLogs.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center bg-black/[0.02] rounded-3xl border border-black/5">
                <p className="text-[11px] font-black text-black/20 uppercase tracking-[0.2em]">No nutritional data for the last 7 days</p>
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis
                        dataKey="displayDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: 'rgba(0,0,0,0.3)' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: 'rgba(0,0,0,0.3)' }}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                        contentStyle={{
                            backgroundColor: 'black',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}
                    />
                    <Bar
                        dataKey="calories"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={40}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.calories > entry.targetCalories ? '#f43f5e' : '#10b981'}
                                fillOpacity={0.8}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
