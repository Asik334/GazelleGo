'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, completed: 0 })
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    setName(prof?.name || '')
    setPhone(prof?.phone || '')

    // Reviews for driver
    const { data: revData } = await supabase.from('reviews')
      .select('*')
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false })
    setReviews(revData || [])

    // Stats
    const field = prof?.role === 'client' ? 'client_id' : 'driver_id'
    const { data: reqData } = await supabase.from('requests').select('status').eq(field, user.id)
    const total = reqData?.length || 0
    const completed = reqData?.filter(r => r.status === 'completed').length || 0
    setStats({ total, completed })

    setLoading(false)
  }

  const saveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ name, phone }).eq('id', user.id)
    setProfile({ ...profile, name, phone })
    setEditing(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="text-zinc-500 hover:text-white text-sm transition-colors">← Назад</Link>
          <button onClick={handleLogout} className="text-zinc-600 hover:text-red-400 text-sm transition-colors">Выйти</button>
        </div>

        {/* Avatar & name */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 mb-4">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-black text-3xl">
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              {editing ? (
                <input value={name} onChange={e => setName(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-white text-xl font-black outline-none mb-1 w-full"
                />
              ) : (
                <h1 className="text-2xl font-black mb-1">{profile?.name || 'Без имени'}</h1>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold capitalize">
                  {profile?.role === 'client' ? '📦 Клиент' : '🚛 Водитель'}
                </span>
                {profile?.car_model && <span className="text-zinc-500 text-sm">{profile.car_model}</span>}
              </div>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1 block">Телефон</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-white text-sm outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveProfile} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2 rounded-xl text-sm transition-colors">Сохранить</button>
                <button onClick={() => setEditing(false)} className="bg-zinc-900 text-zinc-400 px-5 py-2 rounded-xl text-sm hover:text-white transition-colors">Отмена</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-zinc-500 text-sm">{profile?.phone || 'Телефон не указан'}</div>
              <button onClick={() => setEditing(true)} className="text-amber-500 hover:text-amber-400 text-sm font-semibold transition-colors">Редактировать</button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Рейтинг', value: avgRating, icon: '⭐' },
            { label: 'Заказов', value: stats.total, icon: '📋' },
            { label: 'Выполнено', value: stats.completed, icon: '✅' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black text-amber-500">{s.value}</div>
              <div className="text-zinc-600 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Reviews */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <h2 className="font-black text-lg mb-4">Отзывы ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="text-zinc-600 text-sm">Отзывов пока нет</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(rev => (
                <div key={rev.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  {/* Header: client name + stars */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-white">{rev.client_name || 'Клиент'}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <span key={n} className={n <= rev.rating ? 'text-amber-400' : 'text-zinc-700'}>★</span>
                      ))}
                    </div>
                  </div>
                  {/* Order number + route */}
                  {(rev.order_number || rev.from_location) && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                      {rev.order_number && <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded-full">№{rev.order_number}</span>}
                      {rev.from_location && (
                        <>
                          <span className="text-zinc-400">{rev.from_location}</span>
                          <span className="text-amber-500">→</span>
                          <span className="text-zinc-400">{rev.to_location}</span>
                        </>
                      )}
                    </div>
                  )}
                  {/* Review text */}
                  {rev.text && <p className="text-zinc-300 text-sm">{rev.text}</p>}
                  <div className="text-zinc-600 text-xs mt-2">{new Date(rev.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
