'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const cargoTypes = [
  { value: 'general',   label: '📦 Обычный груз' },
  { value: 'fragile',   label: '🫧 Хрупкий' },
  { value: 'heavy',     label: '🏋️ Тяжёлый' },
  { value: 'furniture', label: '🛋️ Мебель' },
  { value: 'food',      label: '🍎 Продукты' },
  { value: 'livestock', label: '🐄 Скот' },
]

export default function CreateRequestPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    from_location: '', to_location: '', description: '',
    datetime: '', price: '', cargo_type: 'general', weight: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
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
        weight: form.weight ? parseFloat(form.weight) : null,
        status: 'open',
      }])
      if (error) setError(error.message)
      else router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">

      {/* ── Mobile Header ─────────────────── */}
      <header className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/dashboard" aria-label="Назад"
            className="text-zinc-500 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-xl">
            ←
          </Link>
          <h1 className="font-bold text-base">Новая заявка</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 pb-10 md:px-6 md:pt-10">
        {/* Desktop back */}
        <Link href="/dashboard" className="hidden md:inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-8 transition-colors">
          ← Назад к заявкам
        </Link>

        <div className="hidden md:block mb-6">
          <h1 className="text-3xl font-black mb-1">Новая заявка</h1>
          <p className="text-zinc-500">Заполните данные о перевозке</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* ── Route ──────────────────────── */}
          <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 md:p-6 space-y-4">
            <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Маршрут</h2>

            <div>
              <label htmlFor="from" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Откуда
              </label>
              <input
                id="from"
                type="text"
                value={form.from_location}
                onChange={e => update('from_location', e.target.value)}
                placeholder="Город, адрес"
                autoComplete="off"
                required
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-base min-h-[52px]"
              />
            </div>

            <div>
              <label htmlFor="to" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Куда
              </label>
              <input
                id="to"
                type="text"
                value={form.to_location}
                onChange={e => update('to_location', e.target.value)}
                placeholder="Город, адрес"
                autoComplete="off"
                required
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-base min-h-[52px]"
              />
            </div>
          </section>

          {/* ── Cargo ──────────────────────── */}
          <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 md:p-6 space-y-4">
            <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Груз</h2>

            <div>
              <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Тип груза</div>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Тип груза">
                {cargoTypes.map(ct => (
                  <button
                    key={ct.value}
                    type="button"
                    role="radio"
                    aria-checked={form.cargo_type === ct.value}
                    onClick={() => update('cargo_type', ct.value)}
                    className={`px-3 py-3 rounded-xl text-sm font-medium border transition-all text-left min-h-[52px]
                      ${form.cargo_type === ct.value
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 active:border-zinc-600'
                      }`}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="weight" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Вес груза (кг){' '}
                <span className="text-zinc-600 normal-case font-normal">(необязательно)</span>
              </label>
              <input
                id="weight"
                type="number"
                inputMode="numeric"
                value={form.weight}
                onChange={e => update('weight', e.target.value)}
                placeholder="Например: 500"
                min="0"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-base min-h-[52px]"
              />
            </div>

            <div>
              <label htmlFor="desc" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Описание груза
              </label>
              <textarea
                id="desc"
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Габариты, особые требования..."
                rows={3}
                required
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-base resize-none"
              />
            </div>
          </section>

          {/* ── Time & Price ───────────────── */}
          <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 md:p-6 space-y-4">
            <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Время и цена</h2>

            <div>
              <label htmlFor="datetime" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Дата и время
              </label>
              <input
                id="datetime"
                type="datetime-local"
                value={form.datetime}
                onChange={e => update('datetime', e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white outline-none transition-colors text-base [color-scheme:dark] min-h-[52px]"
              />
            </div>

            <div>
              <label htmlFor="price" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Предлагаемая цена ₸{' '}
                <span className="text-zinc-600 normal-case font-normal">(необязательно)</span>
              </label>
              <input
                id="price"
                type="number"
                inputMode="numeric"
                value={form.price}
                onChange={e => update('price', e.target.value)}
                placeholder="5 000"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-base min-h-[52px]"
              />
            </div>
          </section>

          {error && (
            <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-colors text-base min-h-[56px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Публикация...
              </span>
            ) : '🚀 Опубликовать заявку'}
          </button>
        </form>
      </div>
    </div>
  )
}
