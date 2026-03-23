'use client'

import { useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || 'client'

  const [role, setRole] = useState<'client' | 'driver'>(defaultRole as 'client' | 'driver')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [carModel, setCarModel] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([{
        id: data.user.id,
        name,
        phone,
        role,
        car_model: role === 'driver' ? carModel : null,
        rating: 0,
        trips_count: 0,
      }])
      if (profileError) setError(profileError.message)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-orange-600/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
            <span className="text-black font-black text-xl">G</span>
          </div>
          <span className="font-black text-2xl tracking-tight text-white">GazelleGo</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
          <h1 className="text-2xl font-black text-white mb-1">Создать аккаунт</h1>
          <p className="text-zinc-500 text-sm mb-6">Выберите свою роль и заполните данные</p>

          {/* Role switcher */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-zinc-900 rounded-xl">
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${role === 'client' ? 'bg-amber-500 text-black shadow' : 'text-zinc-500 hover:text-white'}`}
            >
              📦 Клиент
            </button>
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${role === 'driver' ? 'bg-amber-500 text-black shadow' : 'text-zinc-500 hover:text-white'}`}
            >
              🚛 Водитель
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Имя</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Иван Петров"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm"
                required />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm"
                required />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Телефон</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+7 (777) 000-00-00"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm"
              />
            </div>
            {role === 'driver' && (
              <div>
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Марка и модель авто</label>
                <input type="text" value={carModel} onChange={e => setCarModel(e.target.value)}
                  placeholder="ГАЗель Next 2022"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm"
                  required={role === 'driver'} />
              </div>
            )}
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm"
                required />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition-colors mt-2">
              {loading ? 'Создание...' : `Зарегистрироваться как ${role === 'client' ? 'клиент' : 'водитель'} →`}
            </button>
          </form>

          <p className="text-center text-zinc-600 text-sm mt-6">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-amber-500 hover:text-amber-400 font-semibold">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
