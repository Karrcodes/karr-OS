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
        console.log('Registering service worker...')
        const registration = await registerServiceWorker()
        if (!registration) {
            const isSecure = window.isSecureContext
            console.error('Service Worker registration failed. IsSecureContext:', isSecure)
            throw new Error(`Service Worker registration failed. (Secure Context: ${isSecure})`)
        }

        // 3. Request permission explicitly
        console.log('Requesting notification permission... Current status:', Notification.permission)
        const permission = await Notification.requestPermission()
        console.log('Permission result:', permission)

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

        // 6. Send initial test notification locally
        try {
            await registration.showNotification('Notifications Enabled', {
                body: "You'll now receive real-time updates.",
                icon: '/app-icon.png',
                badge: '/app-icon.png',
                tag: 'subscription-confirmed'
            })
        } catch (err) {
            console.warn('Could not show initial notification:', err)
        }

        return { success: true }
    } catch (error: any) {
        console.error('Push subscription error details:', error)
        return { success: false, error: error.message }
    }
}

export async function checkPushSubscription() {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) return false

    try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (!registration) return false

        const subscription = await registration.pushManager.getSubscription()
        return !!subscription
    } catch (error) {
        console.error('Error checking subscription:', error)
        return false
    }
}

export async function unsubscribeFromPushNotifications() {
    try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
            // 1. Delete from Server
            await fetch('/api/notifications/subscribe', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            })

            // 2. Unsubscribe from Browser
            await subscription.unsubscribe()
        }

        return { success: true }
    } catch (error: any) {
        console.error('Error unsubscribing:', error)
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
