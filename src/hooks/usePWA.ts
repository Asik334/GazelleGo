'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window)
  }, [])

  const subscribe = async () => {
    if (!supported) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), userId: user.id }),
      })

      setSubscribed(true)
    } catch (err) {
      console.error('Push subscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkSubscribed = async () => {
    if (!supported) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setSubscribed(!!sub)
  }

  useEffect(() => { checkSubscribed() }, [supported])

  return { supported, subscribed, loading, subscribe }
}

export function usePWA() {
  const [isOffline, setIsOffline] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [swUpdate, setSwUpdate] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOffline(!navigator.onLine)

    const handleInstall = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handleInstall)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => setSwUpdate(true))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstall)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setIsInstallable(false)
    return outcome === 'accepted'
  }

  const updateApp = () => window.location.reload()

  return { isOffline, isInstallable, swUpdate, installApp, updateApp }
}
