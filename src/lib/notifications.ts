'use client'

import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export async function registerServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js')
            return registration
        } catch (error) {
            console.error('Service Worker registration failed:', error)
            return null
        }
    }
}

export async function subscribeToPushNotifications() {
    try {
        console.log('Starting push subscription flow...')

        // 1. Check if VAPID key is presence
        if (!VAPID_PUBLIC_KEY) {
            console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing in environment')
            throw new Error('Server configuration error: VAPID key missing')
        }

        // 2. Register/Get Service Worker
        const registration = await registerServiceWorker()
        if (!registration) {
            console.error('Service Worker registration failed or not supported')
            throw new Error('Service Worker not supported or registration failed')
        }

        // 3. Request permission explicitly (required by some browsers)
        console.log('Requesting notification permission...')
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
            console.error('Notification permission denied')
            throw new Error('Permission not granted for notifications')
        }

        // 4. Subscribe
        console.log('Subscribing to PushManager...')
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })

        console.log('Push subscription successful, saving to server...')

        // 5. Save to Supabase
        const response = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Server failed to save subscription:', errorText)
            throw new Error('Failed to save subscription on server')
        }

        console.log('Subscription saved successfully!')
        return { success: true }
    } catch (error: any) {
        console.error('Push subscription error details:', error)
        return { success: false, error: error.message }
    }
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
