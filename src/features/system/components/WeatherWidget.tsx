'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, CloudDrizzle, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface WeatherData {
    temperature: number
    weatherCode: number
    isDay: boolean
    locationSource: 'gps' | 'fallback'
}

export function WeatherWidget() {
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const fetchWeather = useCallback(async (lat: number, lon: number, source: 'gps' | 'fallback') => {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            )
            const data = await response.json()

            if (data.current_weather) {
                setWeather({
                    temperature: data.current_weather.temperature,
                    weatherCode: data.current_weather.weathercode,
                    isDay: data.current_weather.is_day === 1,
                    locationSource: source
                })
            }
            setLoading(false)
            setError(false)
        } catch (err) {
            console.error('Weather fetch failed:', err)
            setError(true)
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const startWeatherSync = () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        fetchWeather(position.coords.latitude, position.coords.longitude, 'gps')
                    },
                    (err) => {
                        console.warn('Geolocation denied/failed, falling back to London:', err)
                        fetchWeather(51.5074, -0.1278, 'fallback')
                    },
                    { timeout: 10000, enableHighAccuracy: true }
                )
            } else {
                fetchWeather(51.5074, -0.1278, 'fallback')
            }
        }

        startWeatherSync()
        const interval = setInterval(startWeatherSync, 1800000) // Update every 30 mins
        return () => clearInterval(interval)
    }, [fetchWeather])

    const getWeatherConfig = (code: number) => {
        switch (code) {
            case 0: return { icon: Sun, label: 'Clear', color: 'text-amber-500', animation: { rotate: 360 } }
            case 1:
            case 2:
            case 3: return { icon: Cloud, label: 'Cloudy', color: 'text-blue-400', animation: { x: [0, 5, 0] } }
            case 45:
            case 48: return { icon: CloudFog, label: 'Foggy', color: 'text-slate-400', animation: { opacity: [0.5, 1, 0.5] } }
            case 51:
            case 53:
            case 55: return { icon: CloudDrizzle, label: 'Drizzle', color: 'text-blue-300', animation: { y: [0, 3, 0] } }
            case 61:
            case 63:
            case 65: return { icon: CloudRain, label: 'Rainy', color: 'text-blue-500', animation: { scale: [1, 1.1, 1] } }
            case 71:
            case 73:
            case 75: return { icon: CloudSnow, label: 'Snowy', color: 'text-blue-100', animation: { rotate: [0, 10, -10, 0] } }
            case 80:
            case 81:
            case 82: return { icon: CloudRain, label: 'Showers', color: 'text-blue-600', animation: { y: [0, 5, 0] } }
            case 95: return { icon: CloudLightning, label: 'Stormy', color: 'text-purple-500', animation: { opacity: [1, 0.5, 1] } }
            default: return { icon: Cloud, label: 'Cloudy', color: 'text-slate-400', animation: { x: [0, 5, 0] } }
        }
    }

    if (loading) return (
        <div className="flex items-center gap-2 text-black/20 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span className="text-[10px] uppercase font-black tracking-widest leading-none">Scanning Skies</span>
        </div>
    )

    if (error || !weather) return null

    const config = getWeatherConfig(weather.weatherCode)
    const Icon = config.icon

    return (
        <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-black/[0.02] border border-black/[0.05] rounded-xl px-3 py-2 cursor-help group/weather relative"
            title={weather.locationSource === 'gps' ? 'Accurate to your GPS location' : 'Defaulting to London (Location access required)'}
        >
            <div className="relative">
                <motion.div
                    animate={config.animation}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                    <Icon className={cn("w-4 h-4", config.color)} />
                </motion.div>
            </div>
            <div className="flex flex-col">
                <div className="flex items-baseline gap-1 leading-none">
                    <span className="text-[13px] font-black text-black">{Math.round(weather.temperature)}°</span>
                    <span className="text-[8px] font-black text-black/20 uppercase tracking-tighter">Celsius</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest leading-none">
                        {config.label}
                    </p>
                    <div className={cn(
                        "w-1 h-1 rounded-full",
                        weather.locationSource === 'gps' ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" : "bg-black/10"
                    )} />
                </div>
            </div>
        </motion.div>
    )
}
