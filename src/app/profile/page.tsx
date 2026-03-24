'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { SkeletonProfile } from '@/components/Skeletons'
import { usePushNotifications } from '@/hooks/usePWA'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, completed: 0 })
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { supported: pushSupported, subscribed: pushSubscribed, loading: pushLoading, subscribe: pushSubscribe } = usePushNotifications()

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      setName(prof?.name || '')
      setPhone(prof?.phone || '')

      const { data: revData } = await supabase.from('reviews')
        .select('*').eq('driver_id', user.id).order('created_at', { ascending: false })
      setReviews(revData || [])

      const field = prof?.role === 'client' ? 'client_id' : 'driver_id'
      const { data: reqData } = await supabase.from('requests').select('status').eq(field, user.id)
      const total = reqData?.length || 0
      const completed = reqData?.filter(r => r.status === 'completed').length || 0
      setStats({ total, completed })
    } catch (err) {
      console.error('fetchProfile error:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('profiles').update({ name, phone }).eq('id', user.id)
      setProfile((p: any) => ({ ...p, name, phone }))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  if (loading) return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white pb-[72px]">
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 px-4 py-3 md:hidden">
        <div className="h-5 w-24 bg-zinc-800 rounded animate-pulse" />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <SkeletonProfile />
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">

      {/* ── Mobile Header ──────────────────────── */}
      <header className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="text-zinc-500 hover:text-white text-sm transition-colors min-h-[44px] flex items-center gap-1"
          >
            ← Назад
          </Link>
          <span className="font-bold text-sm">Профиль</span>
          <button
            onClick={handleLogout}
            className="text-zinc-600 hover:text-red-400 text-sm transition-colors min-h-[44px] flex items-center"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 md:px-6 md:py-10 pb-[88px] md:pb-10">

        {/* Desktop back/logout row */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <Link href="/dashboard" className="text-zinc-500 hover:text-white text-sm transition-colors">← Назад</Link>
          <button onClick={handleLogout} className="text-zinc-600 hover:text-red-400 text-sm transition-colors">Выйти</button>
        </div>

        {/* ── Profile Card ──────────────────────── */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 md:p-8 mb-4 animate-in">
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-black text-2xl md:text-3xl shrink-0" aria-hidden>
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  aria-label="Имя"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-white text-lg font-black outline-none mb-2 transition-colors"
                />
              ) : (
                <h1 className="text-xl md:text-2xl font-black mb-1 truncate">{profile?.name || 'Без имени'}</h1>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                  {profile?.role === 'client' ? '📦 Клиент' : '🚛 Водитель'}
                </span>
                {profile?.verified_status === 'verified' && (
                  <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                    ✓ Верифицирован
                  </span>
                )}
                {profile?.verified_status === 'pending' && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                    ⏳ На проверке
                  </span>
                )}
                {profile?.car_model && (
                  <span className="text-zinc-500 text-sm truncate">{profile.car_model}</span>
                )}
              </div>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="phone-input" className="text-zinc-500 text-xs uppercase tracking-wider mb-1 block">
                  Телефон
                </label>
                <input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-3 text-white text-base outline-none transition-colors min-h-[52px]"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm transition-colors min-h-[52px]"
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  onClick={() => { setEditing(false); setName(profile?.name || ''); setPhone(profile?.phone || '') }}
                  className="flex-1 bg-zinc-900 text-zinc-400 hover:text-white py-3 rounded-xl text-sm transition-colors min-h-[52px]"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="text-zinc-500 text-sm min-w-0">
                {profile?.phone ? (
                  <a href={`tel:${profile.phone}`} className="hover:text-amber-400 transition-colors">
                    📞 {profile.phone}
                  </a>
                ) : 'Телефон не указан'}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-amber-500 hover:text-amber-400 text-sm font-semibold transition-colors min-h-[44px] flex items-center shrink-0"
              >
                Редактировать
              </button>
            </div>
          )}
        </div>

        {/* ── Push Notifications ────────────────── */}
        {pushSupported && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-sm mb-0.5">🔔 Уведомления</div>
                <div className="text-zinc-500 text-xs">
                  {pushSubscribed ? 'Включены — вы получаете уведомления о заявках' : 'Включите, чтобы не пропускать заявки'}
                </div>
              </div>
              {pushSubscribed ? (
                <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-full font-semibold shrink-0">
                  ✓ Включены
                </span>
              ) : (
                <button
                  onClick={pushSubscribe}
                  disabled={pushLoading}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors shrink-0 min-h-[44px]"
                >
                  {pushLoading ? '...' : 'Включить'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Verification CTA (drivers only) ───── */}
        {profile?.role === 'driver' && !['verified', 'pending'].includes(profile?.verified_status) && (
          <Link href="/profile/verify" className="block bg-zinc-950 border border-amber-500/20 hover:border-amber-500/50 rounded-2xl p-5 mb-4 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-sm mb-0.5">🛡 Верификация водителя</div>
                <div className="text-zinc-500 text-xs">Загрузите документы и получите бейдж доверия</div>
              </div>
              <span className="text-amber-500 text-lg shrink-0">→</span>
            </div>
          </Link>
        )}
        {profile?.role === 'driver' && profile?.verified_status === 'pending' && (
          <div className="bg-zinc-950 border border-yellow-500/20 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">⏳</span>
              <div>
                <div className="font-semibold text-sm text-yellow-400 mb-0.5">Документы на проверке</div>
                <div className="text-zinc-500 text-xs">Обычно занимает до 24 часов</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Stats Grid ────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Рейтинг', value: avgRating, icon: '⭐' },
            { label: 'Заказов', value: stats.total, icon: '📋' },
            { label: 'Выполнено', value: stats.completed, icon: '✅' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 text-center">
              <div className="text-xl mb-1" aria-hidden>{s.icon}</div>
              <div className="text-xl md:text-2xl font-black text-amber-500">{s.value}</div>
              <div className="text-zinc-600 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Reviews ───────────────────────────── */}
        {profile?.role === 'driver' && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 md:p-6">
            <h2 className="font-black text-lg mb-4">
              Отзывы
              <span className="text-zinc-500 font-normal text-base ml-2">({reviews.length})</span>
            </h2>

            {reviews.length === 0 ? (
              <div className="text-center py-8 text-zinc-600">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm">Отзывов пока нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(rev => (
                  <div key={rev.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="font-semibold text-sm text-white truncate">{rev.client_name || 'Клиент'}</span>
                      <div className="flex gap-0.5 shrink-0" aria-label={`Рейтинг: ${rev.rating} из 5`}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <span key={n} className={n <= rev.rating ? 'text-amber-400' : 'text-zinc-700'} aria-hidden>★</span>
                        ))}
                      </div>
                    </div>
                    {(rev.order_number || rev.from_location) && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2 flex-wrap">
                        {rev.order_number && (
                          <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded-full">№{rev.order_number}</span>
                        )}
                        {rev.from_location && (
                          <>
                            <span className="text-zinc-400 truncate max-w-[80px]">{rev.from_location}</span>
                            <span className="text-amber-500">→</span>
                            <span className="text-zinc-400 truncate max-w-[80px]">{rev.to_location}</span>
                          </>
                        )}
                      </div>
                    )}
                    {rev.text && <p className="text-zinc-300 text-sm leading-relaxed">{rev.text}</p>}
                    <div className="text-zinc-600 text-xs mt-2">
                      {new Date(rev.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <MobileBottomNav userRole={profile?.role} />
    </div>
  )
}
