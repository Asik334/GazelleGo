'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const statusLabel: Record<string, { label: string; color: string }> = {
  open:        { label: 'Ожидает водителя', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  accepted:    { label: 'В работе',         color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  in_progress: { label: 'В пути',           color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  completed:   { label: 'Выполнено',        color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled:   { label: 'Отменено',         color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const cargoLabel: Record<string, string> = {
  general:  '📦 Обычный груз',
  fragile:  '🫧 Хрупкий груз',
  heavy:    '🏋️ Тяжёлый груз',
  furniture:'🛋️ Мебель',
  food:     '🍎 Продукты',
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'all'>('active')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reviewModal, setReviewModal] = useState<{ requestId: string; driverId: string } | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviews, setReviews] = useState<Record<string, any[]>>({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    let reqs: any[] = []
    if (prof?.role === 'client') {
      const { data } = await supabase.from('requests').select('*').eq('client_id', user.id).order('created_at', { ascending: false })
      reqs = data || []
    } else {
      const { data } = await supabase.from('requests').select('*')
        .or(`status.eq.open,driver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      reqs = data || []
    }
    setRequests(reqs)

    // Load reviews for completed requests
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

    setLoading(false)
  }

  const acceptRequest = async (id: string) => {
    const { error } = await supabase.from('requests').update({ status: 'accepted', driver_id: profile.id }).eq('id', id)
    if (error) alert('Ошибка: ' + error.message)
    else fetchData()
  }

  const completeRequest = async (id: string) => {
    const { error } = await supabase.from('requests').update({ status: 'completed' }).eq('id', id)
    if (!error) fetchData()
  }

  const submitReview = async () => {
    if (!reviewModal) return
    const { error } = await supabase.from('reviews').insert([{
      request_id: reviewModal.requestId,
      driver_id: reviewModal.driverId,
      client_id: profile.id,
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

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col z-20 hidden md:flex">
        <div className="p-6 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-lg">G</span>
            </div>
            <span className="font-black text-lg tracking-tight">GazelleGo</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-zinc-600 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Меню</div>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900 text-white font-medium text-sm">
            <span>🏠</span> Лента заявок
          </Link>
          {profile?.role === 'client' && (
            <Link href="/dashboard/create" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 font-medium text-sm transition-colors">
              <span>➕</span> Новая заявка
            </Link>
          )}
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 font-medium text-sm transition-colors">
            <span>👤</span> Профиль
          </Link>
        </nav>
        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900">
            <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-sm">
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{profile?.name || 'Пользователь'}</div>
              <div className="text-xs text-zinc-500">{profile?.role === 'client' ? 'Клиент' : 'Водитель'}</div>
            </div>
            <button onClick={handleLogout} className="text-zinc-600 hover:text-red-400 transition-colors text-xs">Выйти</button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="md:ml-64 p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">{profile?.role === 'client' ? '📦 Мои заявки' : '🚛 Биржа грузов'}</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {profile?.role === 'client'
                ? `${activeRequests.length} активных заявок`
                : `${requests.filter(r => r.status === 'open').length} свободных заказов`}
            </p>
          </div>
          {profile?.role === 'client' && (
            <Link href="/dashboard/create" className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl transition-colors text-sm flex items-center gap-2">
              ➕ Создать заявку
            </Link>
          )}
        </div>

        <div className="flex gap-1 mb-6 p-1 bg-zinc-950 border border-zinc-900 rounded-xl w-fit">
          {[{ key: 'active', label: 'Активные' }, { key: 'all', label: 'Все' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {shown.length === 0 && (
            <div className="text-center py-20 text-zinc-600">
              <div className="text-5xl mb-4">📭</div>
              <p>Заявок пока нет</p>
              {profile?.role === 'client' && (
                <Link href="/dashboard/create" className="text-amber-500 hover:text-amber-400 text-sm mt-2 inline-block">Создать первую заявку →</Link>
              )}
            </div>
          )}

          {shown.map(req => {
            const st = statusLabel[req.status] || statusLabel.open
            const isExpanded = expanded === req.id
            const reqReviews = reviews[req.id] || []
            const hasReview = reqReviews.some(r => r.client_id === profile?.id)

            return (
              <div key={req.id} className="bg-zinc-950 border border-zinc-900 hover:border-zinc-700 rounded-2xl overflow-hidden transition-colors">
                {/* Card header - always visible */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${st.color}`}>{st.label}</span>
                        <span className="text-zinc-600 text-xs">{new Date(req.created_at).toLocaleDateString('ru-RU')}</span>
                        {req.cargo_type && (
                          <span className="text-xs text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
                            {cargoLabel[req.cargo_type] || req.cargo_type}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-lg font-bold mb-2">
                        <span className="truncate">{req.from_location}</span>
                        <span className="text-amber-500 shrink-0">→</span>
                        <span className="truncate">{req.to_location}</span>
                      </div>

                      <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{req.description}</p>

                      <div className="flex items-center gap-4 text-sm text-zinc-500 flex-wrap">
                        <span>🕐 {new Date(req.datetime).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {req.price && <span className="text-green-400 font-semibold">💰 {Number(req.price).toLocaleString()} ₸</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {profile?.role === 'driver' && req.status === 'open' && (
                        <button onClick={() => acceptRequest(req.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors">
                          Принять
                        </button>
                      )}
                      {profile?.role === 'driver' && req.status === 'accepted' && req.driver_id === profile.id && (
                        <button onClick={() => completeRequest(req.id)}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
                          Завершить
                        </button>
                      )}
                      {(req.status === 'accepted' || req.status === 'in_progress') && (
                        <Link href={`/dashboard/chat/${req.id}`}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors text-center">
                          💬 Чат
                        </Link>
                      )}
                      {req.status === 'completed' && profile?.role === 'client' && !hasReview && req.driver_id && (
                        <button onClick={() => setReviewModal({ requestId: req.id, driverId: req.driver_id })}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-400 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                          ⭐ Отзыв
                        </button>
                      )}
                      <button onClick={() => setExpanded(isExpanded ? null : req.id)}
                        className="text-zinc-600 hover:text-zinc-300 text-xs text-center transition-colors py-1">
                        {isExpanded ? '▲ Свернуть' : '▼ Подробнее'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-zinc-900 px-6 py-5 bg-zinc-950/50 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Откуда</div>
                        <div className="text-white font-medium">{req.from_location}</div>
                      </div>
                      <div>
                        <div className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Куда</div>
                        <div className="text-white font-medium">{req.to_location}</div>
                      </div>
                      <div>
                        <div className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Тип груза</div>
                        <div className="text-white">{cargoLabel[req.cargo_type] || req.cargo_type || '—'}</div>
                      </div>
                      <div>
                        <div className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Дата и время</div>
                        <div className="text-white">{new Date(req.datetime).toLocaleString('ru-RU')}</div>
                      </div>
                      <div>
                        <div className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Цена</div>
                        <div className="text-green-400 font-semibold">{req.price ? Number(req.price).toLocaleString() + ' ₸' : 'Договорная'}</div>
                      </div>
                      <div>
                        <div className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Статус</div>
                        <div className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</div>
                      </div>
                    </div>
                    {req.description && (
                      <div>
                        <div className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Описание груза</div>
                        <div className="text-zinc-300 text-sm bg-zinc-900 rounded-xl p-3 border border-zinc-800">{req.description}</div>
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
                              {rev.text && <p className="text-zinc-300 text-sm">{rev.text}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">⭐ Оставить отзыв</h2>
            <div className="mb-4">
              <div className="text-zinc-400 text-sm mb-2">Оценка</div>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)}
                    className={`text-2xl transition-transform hover:scale-110 ${n <= reviewRating ? 'text-amber-400' : 'text-zinc-700'}`}>
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
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                Отмена
              </button>
              <button onClick={submitReview}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl text-sm transition-colors">
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
