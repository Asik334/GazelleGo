'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type VerifyStatus = 'none' | 'pending' | 'verified' | 'rejected'

export default function VerifyPage() {
  const router = useRouter()
  const [status, setStatus] = useState<VerifyStatus>('none')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [carFile, setCarFile] = useState<File | null>(null)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const { data: prof } = await supabase
      .from('profiles').select('role, verified_status').eq('id', user.id).single()

    if (prof?.role !== 'driver') { router.push('/profile'); return }
    setStatus((prof?.verified_status as VerifyStatus) || 'none')
    setLoading(false)
  }

  const handleUpload = async () => {
    if (!licenseFile && !carFile) { setError('Загрузите хотя бы один документ'); return }
    setUploading(true)
    setError('')
    try {
      const uploads = []

      if (licenseFile) {
        const path = `${userId}/license_${Date.now()}.${licenseFile.name.split('.').pop()}`
        const { error: e } = await supabase.storage
          .from('verifications').upload(path, licenseFile, { upsert: true })
        if (e) throw e
        uploads.push({ type: 'license', path })
      }

      if (carFile) {
        const path = `${userId}/car_${Date.now()}.${carFile.name.split('.').pop()}`
        const { error: e } = await supabase.storage
          .from('verifications').upload(path, carFile, { upsert: true })
        if (e) throw e
        uploads.push({ type: 'car', path })
      }

      // Save verification request
      await supabase.from('verification_requests').upsert({
        driver_id: userId,
        status: 'pending',
        files: uploads,
        created_at: new Date().toISOString(),
      }, { onConflict: 'driver_id' })

      // Update profile status
      await supabase.from('profiles')
        .update({ verified_status: 'pending' }).eq('id', userId)

      setStatus('pending')
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return (
    <div className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <Link href="/profile" className="text-zinc-500 hover:text-white text-sm transition-colors min-h-[44px] flex items-center gap-1">
            ← Назад
          </Link>
          <span className="font-bold text-sm">Верификация</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* Status banner */}
        {status === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 mb-5 flex items-start gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <div className="font-bold text-yellow-400 mb-1">На проверке</div>
              <div className="text-zinc-400 text-sm">Документы отправлены. Проверка занимает до 24 часов.</div>
            </div>
          </div>
        )}

        {status === 'verified' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mb-5 flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-bold text-green-400 mb-1">Верифицирован</div>
              <div className="text-zinc-400 text-sm">Ваш профиль подтверждён. Клиенты видят бейдж верификации.</div>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-5 flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <div className="font-bold text-red-400 mb-1">Отклонено</div>
              <div className="text-zinc-400 text-sm">Документы не прошли проверку. Загрузите новые.</div>
            </div>
          </div>
        )}

        {(status === 'none' || status === 'rejected') && (
          <div className="space-y-4">
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
              <h2 className="font-black text-lg mb-1">Подтвердите личность</h2>
              <p className="text-zinc-500 text-sm mb-5">
                Верифицированные водители получают бейдж и больше доверия от клиентов.
              </p>

              {/* License upload */}
              <div className="mb-4">
                <label className="block text-zinc-400 text-sm font-semibold mb-2">
                  📄 Водительское удостоверение
                </label>
                <label className={`flex items-center justify-between gap-3 bg-zinc-900 border rounded-xl px-4 py-3 cursor-pointer transition-colors min-h-[52px] ${licenseFile ? 'border-amber-500/50 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                  <span className="text-sm truncate">{licenseFile ? licenseFile.name : 'Выбрать файл (фото/PDF)'}</span>
                  <span className="text-xs bg-zinc-800 px-2 py-1 rounded-lg shrink-0">Обзор</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={e => setLicenseFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {/* Car photo upload */}
              <div className="mb-5">
                <label className="block text-zinc-400 text-sm font-semibold mb-2">
                  🚛 Фото автомобиля с номером
                </label>
                <label className={`flex items-center justify-between gap-3 bg-zinc-900 border rounded-xl px-4 py-3 cursor-pointer transition-colors min-h-[52px] ${carFile ? 'border-amber-500/50 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                  <span className="text-sm truncate">{carFile ? carFile.name : 'Выбрать фото'}</span>
                  <span className="text-xs bg-zinc-800 px-2 py-1 rounded-lg shrink-0">Обзор</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setCarFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || (!licenseFile && !carFile)}
                className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-black font-bold py-3.5 rounded-xl transition-colors min-h-[52px]"
              >
                {uploading ? 'Загрузка...' : 'Отправить на проверку'}
              </button>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4">
              <div className="text-zinc-500 text-xs space-y-1.5">
                <div>• Файлы хранятся зашифрованно и видны только администратору</div>
                <div>• Принимаются форматы: JPG, PNG, PDF</div>
                <div>• Максимальный размер файла: 10 МБ</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
