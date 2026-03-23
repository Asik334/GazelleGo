'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateRequestPage() {
  const router = useRouter()
  const [form, setForm] = useState({ from_location: '', to_location: '', description: '', datetime: '', price: '', cargo_type: 'general' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cargoTypes = [
    { value: 'general', label: '📦 Обычный груз' },
    { value: 'fragile', label: '🫧 Хрупкий груз' },
    { value: 'heavy', label: '🏋️ Тяжёлый груз' },
    { value: 'furniture', label: '🛋️ Мебель' },
    { value: 'food', label: '🍎 Продукты' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('requests').insert([{
      client_id: user.id,
      from_location: form.from_location,
      to_location: form.to_location,
      description: form.description,
      datetime: form.datetime,
      cargo_type: form.cargo_type,
      price: form.price ? parseFloat(form.price) : null,
      status: 'pending',
    }])
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-8 transition-colors">
          ← Назад к заявкам
        </Link>

        <h1 className="text-3xl font-black mb-2">Новая заявка</h1>
        <p className="text-zinc-500 mb-8">Заполните данные о перевозке</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Маршрут</h2>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Откуда</label>
              <input type="text" value={form.from_location} onChange={e => setForm({ ...form, from_location: e.target.value })}
                placeholder="Город, адрес"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm"
                required />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Куда</label>
              <input type="text" value={form.to_location} onChange={e => setForm({ ...form, to_location: e.target.value })}
                placeholder="Город, адрес"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm"
                required />
            </div>
          </div>

          {/* Cargo */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Груз</h2>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Тип груза</label>
              <div className="grid grid-cols-2 gap-2">
                {cargoTypes.map(ct => (
                  <button key={ct.value} type="button" onClick={() => setForm({ ...form, cargo_type: ct.value })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${form.cargo_type === ct.value ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Описание груза</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Что везём? Вес, габариты, особые требования..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm resize-none"
                required />
            </div>
          </div>

          {/* Time & Price */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Время и цена</h2>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Дата и время</label>
              <input type="datetime-local" value={form.datetime} onChange={e => setForm({ ...form, datetime: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white outline-none transition-colors text-sm [color-scheme:dark]"
                required />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Предлагаемая цена ₸ <span className="text-zinc-600 normal-case font-normal">(необязательно)</span>
              </label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="5 000"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-4 rounded-xl transition-colors text-base">
            {loading ? 'Публикация...' : '🚀 Опубликовать заявку'}
          </button>
        </form>
      </div>
    </div>
  )
}
