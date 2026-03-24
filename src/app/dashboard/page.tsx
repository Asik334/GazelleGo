'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { SkeletonList } from '@/components/Skeletons'

const statusLabel: Record<string, { label: string; color: string }> = {
  open:        { label: 'Ожидает водителя', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  accepted:    { label: 'В работе',         color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  in_progress: { label: 'В пути',           color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  completed:   { label: 'Выполнено',        color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled:   { label: 'Отменено',         color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const cargoLabel: Record<string, string> = {
  general:   '📦 Обычный груз',
  fragile:   '🫧 Хрупкий груз',
  heavy:     '🏋️ Тяжёлый груз',
  furniture: '🛋️ Мебель',
  food:      '🍎 Продукты',
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<'active' | 'all'>('active')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reviewModal, setReviewModal] = useState<{
    requestId: string; driverId: string; orderNumber: number
    fromLocation: string; toLocation: string
  } | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviews, setReviews] = useState<Record<string, any[]>>({})
  const [clientProfiles, setClientProfiles] = useState<Record<string, any>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      let reqs: any[] = []
      if (prof?.role === 'client') {
        const { data } = await supabase.from('requests').select('*')
          .eq('client_id', user.id).order('created_at', { ascending: false })
        reqs = data || []
      } else {
        const { data } = await supabase.from('requests').select('*')
          .or(`status.eq.open,driver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
        reqs = data || []
      }
      setRequests(reqs)

      if (prof?.role === 'driver' && reqs.length > 0) {
        const clientIds = [...new Set(reqs.map((r: any) => r.client_id).filter(Boolean))]
        if (clientIds.length > 0) {
          const { data: clientData } = await supabase
            .from('profiles').select('id, name, phone').in('id', clientIds)
          const map: Record<string, any> = {}
          for (const c of clientData || []) map[c.id] = c
          setClientProfiles(map)
        }
      }

      const completedIds = reqs.filter(r => r.status === 'completed').map(r => r.id)
      if (completedIds.length > 0) {
        const { data: revData } = await supabase.from('reviews').select('*').in('request_id', completedIds)
        const grouped: Record<string, any[]> = {}
        for (const rev of revData || []) {
          if (!grouped[rev.request_id]) grouped[rev.request_id] = []
          grouped[rev.request_id].push(rev)
        }
        setReviews(grouped)
      }
    } catch (err) {
      console.error('fetchData error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        fetchData()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
  }

  const acceptRequest = async (id: string) => {
    setActionLoading(id)
    try {
      const { error } = await supabase.from('requests')
        .update({ status: 'accepted', driver_id: profile.id }).eq('id', id)
      if (error) alert('Ошибка: ' + error.message)
      else await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  const completeRequest = async (id: string) => {
    setActionLoading(id)
    try {
      const { error } = await supabase.from('requests').update({ status: 'completed' }).eq('id', id)
      if (!error) await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  const submitReview = async () => {
    if (!reviewModal) return
    const { error } = await supabase.from('reviews').insert([{
      request_id: reviewModal.requestId,
      driver_id: reviewModal.driverId,
      client_id: profile.id,
      client_name: profile.name || 'Клиент',
      order_number: reviewModal.orderNumber,
      from_location: reviewModal.fromLocation,
      to_location: reviewModal.toLocation,
      rating: reviewRating,
      text: reviewText.trim(),
    }])
    if (error) alert('Ошибка: ' + error.message)
    else {
      setReviewModal(null)
      setReviewText('')
      setReviewRating(5)
      fetchData()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const activeRequests = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled')
  const shown = tab === 'active' ? activeRequests : requests

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white flex flex-col">
      {/* Mobile header skeleton */}
      <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-5 w-28 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex-1 p-4 md:ml-64 md:p-10">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse mb-6" />
        <SkeletonList count={4} />
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-950 border-r border-zinc-900 flex-col z-20 hidden md:flex">
        <div className="p-6 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-lg">G</span>
            </div>
            <span className="font-black text-lg tracking-tight">GazelleGo</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1" aria-label="Основная навигация">
          <div className="text-zinc-600 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Меню</div>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900 text-white font-medium text-sm">
            <span aria-hidden>🏠</span> Лента заявок
          </Link>
          {profile?.role === 'client' && (
            <Link href="/dashboard/create" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 font-medium text-sm transition-colors">
              <span aria-hidden>➕</span> Новая заявка
            </Link>
          )}
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 font-medium text-sm transition-colors">
            <span aria-hidden>👤</span> Профиль
          </Link>
          {profile?.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium text-sm transition-colors border border-transparent hover:border-red-500/20">
              <span aria-hidden>🛡</span> Админка
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900">
            <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-sm shrink-0" aria-hidden>
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{profile?.name || 'Пользователь'}</div>
              <div className="text-xs text-zinc-500">{profile?.role === 'client' ? 'Клиент' : 'Водитель'}</div>
            </div>
            <button onClick={handleLogout} className="text-zinc-600 hover:text-red-400 transition-colors text-xs min-h-[44px] min-w-[44px] flex items-center justify-center">
              Выйти
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Header ───────────────────────────── */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 md:hidden">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-black font-black text-base" aria-hidden>G</span>
            </div>
            <span className="font-black text-base tracking-tight">GazelleGo</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              aria-label="Обновить"
              className="text-zinc-500 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <Link href="/profile" aria-label="Профиль"
              className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-sm shrink-0">
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="md:ml-64 pb-[72px] md:pb-0">
        <div className="px-4 pt-5 pb-2 md:px-10 md:pt-10">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl md:text-2xl font-black leading-tight">
                {profile?.role === 'client' ? '📦 Мои заявки' : '🚛 Биржа грузов'}
              </h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                {profile?.role === 'client'
                  ? `${activeRequests.length} активных`
                  : `${requests.filter(r => r.status === 'open').length} свободных`}
              </p>
            </div>
            {profile?.role === 'client' && (
              <Link href="/dashboard/create"
                className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold px-4 py-2.5 rounded-xl transition-colors text-sm flex items-center gap-1.5 shrink-0 min-h-[44px]">
                <span aria-hidden>➕</span>
                <span className="hidden sm:inline">Создать</span>
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 p-1 bg-zinc-950 border border-zinc-900 rounded-xl w-fit" role="tablist">
            {[
              { key: 'active', label: 'Активные', count: activeRequests.length },
              { key: 'all', label: 'Все', count: requests.length },
            ].map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all min-h-[40px] flex items-center gap-1.5
                  ${tab === t.key ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
              >
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-900 text-zinc-600'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Request Cards ───────────────────────────── */}
        <div className="px-4 pb-6 md:px-10 space-y-3">
          {shown.length === 0 && (
            <div className="text-center py-16 text-zinc-600 animate-in">
              <div className="text-5xl mb-4">📭</div>
              <p className="font-medium">Заявок пока нет</p>
              {profile?.role === 'client' && (
                <Link href="/dashboard/create"
                  className="text-amber-500 hover:text-amber-400 text-sm mt-3 inline-block min-h-[44px] flex items-center justify-center">
                  Создать первую заявку →
                </Link>
              )}
            </div>
          )}

          {shown.map((req) => {
            const st = statusLabel[req.status] || statusLabel.open
            const isExpanded = expanded === req.id
            const reqReviews = reviews[req.id] || []
            const hasReview = reqReviews.some(r => r.client_id === profile?.id)
            const orderNum = req.order_number || (requests.length - requests.findIndex(r => r.id === req.id))
            const isActioning = actionLoading === req.id

            return (
              <article
                key={req.id}
                className="bg-zinc-950 border border-zinc-900 active:border-zinc-700 rounded-2xl overflow-hidden transition-colors"
              >
                <div className="p-4 md:p-6">
                  {/* Top badges row */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs font-black text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full font-mono">
                      №{orderNum}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>
                      {st.label}
                    </span>
                    {req.cargo_type && (
                      <span className="text-xs text-zinc-500">{cargoLabel[req.cargo_type]}</span>
                    )}
                    <span className="text-zinc-700 text-xs ml-auto">
                      {new Date(req.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {/* Route — large and readable */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2 font-bold text-base leading-snug">
                      <span className="truncate max-w-[38%]">{req.from_location}</span>
                      <span className="text-amber-500 shrink-0 text-lg">→</span>
                      <span className="truncate max-w-[38%]">{req.to_location}</span>
                    </div>
                  </div>

                  {req.description && (
                    <p className="text-zinc-400 text-sm mb-3 line-clamp-2 leading-relaxed">
                      {req.description}
                    </p>
                  )}

                  {/* Meta + actions row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 text-sm text-zinc-500 flex-wrap">
                      <span>🕐 {new Date(req.datetime).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {req.price && (
                        <span className="text-green-400 font-semibold">
                          💰 {Number(req.price).toLocaleString()} ₸
                        </span>
                      )}
                    </div>

                    {/* Action buttons — full tap targets */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {profile?.role === 'driver' && req.status === 'open' && (
                        <button
                          onClick={() => acceptRequest(req.id)}
                          disabled={isActioning}
                          className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors min-h-[44px]"
                        >
                          {isActioning ? '...' : 'Принять'}
                        </button>
                      )}
                      {profile?.role === 'driver' && req.status === 'accepted' && req.driver_id === profile.id && (
                        <button
                          onClick={() => completeRequest(req.id)}
                          disabled={isActioning}
                          className="bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors min-h-[44px]"
                        >
                          {isActioning ? '...' : 'Завершить'}
                        </button>
                      )}
                      {(req.status === 'accepted' || req.status === 'in_progress') && (
                        <Link
                          href={`/dashboard/chat/${req.id}`}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors text-center min-h-[44px] flex items-center"
                        >
                          💬 Чат
                        </Link>
                      )}
                      {req.status === 'completed' && profile?.role === 'client' && !hasReview && req.driver_id && (
                        <button
                          onClick={() => setReviewModal({
                            requestId: req.id, driverId: req.driver_id, orderNumber: orderNum,
                            fromLocation: req.from_location, toLocation: req.to_location,
                          })}
                          className="bg-zinc-900 border border-amber-500/30 text-amber-400 font-semibold px-4 py-2 rounded-xl text-sm transition-colors min-h-[44px]"
                        >
                          ⭐ Отзыв
                        </button>
                      )}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : req.id)}
                        aria-expanded={isExpanded}
                        className="text-zinc-600 hover:text-zinc-300 text-xs transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center px-2"
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Expanded Details ─────────────────── */}
                {isExpanded && (
                  <div className="border-t border-zinc-900 px-4 py-4 md:px-6 bg-zinc-950/50 space-y-4 animate-in">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: 'Откуда', value: req.from_location },
                        { label: 'Куда', value: req.to_location },
                        { label: 'Тип груза', value: cargoLabel[req.cargo_type] || req.cargo_type || '—' },
                        { label: 'Дата и время', value: new Date(req.datetime).toLocaleString('ru-RU') },
                        { label: 'Цена', value: req.price ? `${Number(req.price).toLocaleString()} ₸` : 'Договорная', green: true },
                        { label: 'Статус', value: st.label },
                      ].map(({ label, value, green }) => (
                        <div key={label}>
                          <div className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">{label}</div>
                          <div className={green ? 'text-green-400 font-semibold' : 'text-white font-medium'}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {req.description && (
                      <div>
                        <div className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Описание груза</div>
                        <div className="text-zinc-300 text-sm bg-zinc-900 rounded-xl p-3 border border-zinc-800 leading-relaxed">
                          {req.description}
                        </div>
                      </div>
                    )}

                    {/* Client contact for driver */}
                    {profile?.role === 'driver' && clientProfiles[req.client_id] && (
                      <div>
                        <div className="text-zinc-600 text-xs uppercase tracking-wider mb-2">Контакт клиента</div>
                        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                            {clientProfiles[req.client_id].name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-semibold text-sm">{clientProfiles[req.client_id].name || 'Клиент'}</div>
                            {clientProfiles[req.client_id].phone ? (
                              <a href={`tel:${clientProfiles[req.client_id].phone}`}
                                className="text-amber-400 text-sm hover:text-amber-300 transition-colors min-h-[44px] flex items-center">
                                📞 {clientProfiles[req.client_id].phone}
                              </a>
                            ) : (
                              <div className="text-zinc-500 text-sm">Телефон не указан</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reviews */}
                    {reqReviews.length > 0 && (
                      <div>
                        <div className="text-zinc-600 text-xs uppercase tracking-wider mb-2">Отзывы</div>
                        <div className="space-y-2">
                          {reqReviews.map((rev: any) => (
                            <div key={rev.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-amber-400 text-sm">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                                <span className="text-zinc-600 text-xs">{new Date(rev.created_at).toLocaleDateString('ru-RU')}</span>
                              </div>
                              {rev.text && <p className="text-zinc-300 text-sm leading-relaxed">{rev.text}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </main>

      {/* ── Mobile Bottom Navigation ─────────────────────── */}
      <MobileBottomNav userRole={profile?.role} />

      {/* ── Review Modal ─────────────────────────────────── */}
      {reviewModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setReviewModal(null) }}
          role="dialog"
          aria-modal="true"
          aria-label="Оставить отзыв"
        >
          <div className="bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md animate-in safe-area-bottom">
            {/* Drag handle (mobile) */}
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5 sm:hidden" />
            
            <h2 className="text-lg font-bold mb-1">⭐ Оставить отзыв</h2>
            <div className="text-zinc-500 text-sm mb-4 bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
              <span className="text-zinc-600 font-mono text-xs">№{reviewModal.orderNumber}</span>
              <span className="mx-2 text-zinc-700">·</span>
              <span className="text-zinc-300">{reviewModal.fromLocation}</span>
              <span className="text-amber-500 mx-1">→</span>
              <span className="text-zinc-300">{reviewModal.toLocation}</span>
            </div>

            <div className="mb-4">
              <div className="text-zinc-400 text-sm mb-3">Оценка</div>
              <div className="flex gap-3" role="radiogroup" aria-label="Рейтинг">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    role="radio"
                    aria-checked={n <= reviewRating}
                    aria-label={`${n} звезд`}
                    onClick={() => setReviewRating(n)}
                    className={`text-3xl transition-transform active:scale-90 min-h-[44px] min-w-[44px] flex items-center justify-center
                      ${n <= reviewRating ? 'text-amber-400' : 'text-zinc-700'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Напишите отзыв о водителе..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none text-base resize-none mb-4 transition-colors"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors min-h-[52px]"
              >
                Отмена
              </button>
              <button
                onClick={submitReview}
                className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold py-3.5 rounded-xl text-sm transition-colors min-h-[52px]"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
