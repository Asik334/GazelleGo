'use client'

import { useEffect, useState } from 'react'
import { usePWA } from '@/hooks/usePWA'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { isOffline, isInstallable, swUpdate, installApp, updateApp } = usePWA()
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Show install banner after 30s of engagement, only once
    const shown = sessionStorage.getItem('pwa-banner-shown')
    if (!shown && isInstallable && !dismissed) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true)
        sessionStorage.setItem('pwa-banner-shown', '1')
      }, 30_000)
      return () => clearTimeout(timer)
    }
  }, [isInstallable, dismissed])

  const handleInstall = async () => {
    const accepted = await installApp()
    if (accepted) setShowInstallBanner(false)
  }

  return (
    <>
      {children}

      {/* ── Offline Toast ───────────────────────────────────── */}
      <div
        role="status"
        aria-live="polite"
        className={`
          fixed bottom-0 left-0 right-0 z-[100] transition-transform duration-300 ease-out
          ${isOffline ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Нет соединения</p>
            <p className="text-zinc-400 text-xs">Работает в режиме кеша</p>
          </div>
        </div>
      </div>

      {/* ── SW Update Banner ────────────────────────────────── */}
      {swUpdate && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 px-4 py-2 flex items-center gap-3">
          <p className="flex-1 text-black text-sm font-semibold">
            🚀 Доступно обновление приложения
          </p>
          <button
            onClick={updateApp}
            className="bg-black text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 min-h-[36px]"
          >
            Обновить
          </button>
        </div>
      )}

      {/* ── Install Banner ──────────────────────────────────── */}
      {showInstallBanner && !dismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-[99] p-4 safe-area-bottom">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-sm mx-auto">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-black font-black text-2xl">G</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">Установить GazelleGo</p>
              <p className="text-zinc-400 text-xs">Быстрый доступ с главного экрана</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={handleInstall}
                className="bg-amber-500 text-black text-xs font-bold px-3 py-2 rounded-xl min-h-[36px]"
              >
                Установить
              </button>
              <button
                onClick={() => { setShowInstallBanner(false); setDismissed(true) }}
                className="text-zinc-500 text-xs text-center py-1 min-h-[28px]"
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
