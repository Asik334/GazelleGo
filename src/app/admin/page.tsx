'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'aslanesenalin0@gmail.com'

const statusLabel: Record<string, { label: string; color: string }> = {
  open:        { label: 'Ожидает', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  accepted:    { label: 'В работе', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  in_progress: { label: 'В пути', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  completed:   { label: 'Выполнено', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled:   { label: 'Отменено', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const cargoLabel: Record<string, string> = {
  general: '📦 Обычный', fragile: '🫧 Хрупкий',
  heavy: '🏋️ Тяжёлый', furniture: '🛋️ Мебель', food: '🍎 Продукты',
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'stats' | 'users' | 'requests'>('stats')
  const [users, setUsers] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'user' | 'request'; id: string; name: string } | null>(null)
  const [searchUsers, setSearchUsers] = useState('')
  const [searchRequests, setSearchRequests] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    if (user.email !== ADMIN_EMAIL) { router.push('/dashboard'); return }
    await fetchAll()
    setLoading(false)
  }

  const fetchAll = async () => {
    const [{ data: usersData }, { data: reqData }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('requests').select('*').order('created_at', { ascending: false }),
    ])
    setUsers(usersData || [])
    setRequests(reqData || [])
  }

  const deleteRequest = async (id: string) => {
    const r1 = await supabase.from('messages').delete().eq('request_id', id)
    const r2 = await supabase.from('reviews').delete().eq('request_id', id)
    const r3 = await supabase.from('requests').delete().eq('id', id)
    console.log('deleteRequest errors:', r1.error, r2.error, r3.error)
    if (r3.error) { alert('Ошибка: ' + r3.error.message); return }
    setRequests(prev => prev.filter(r => r.id !== id))
    setDeleteConfirm(null)
  }

  const deleteUser = async (id: string) => {
    const userReqs = requests.filter(r => r.client_id === id || r.driver_id === id).map(r => r.id)
    for (const rid of userReqs) {
      await supabase.from('messages').delete().eq('request_id', rid)
      await supabase.from('reviews').delete().eq('request_id', rid)
    }
    const r1 = await supabase.from('requests').delete().or(`client_id.eq.${id},driver_id.eq.${id}`)
    const r2 = await supabase.from('reviews').delete().or(`client_id.eq.${id},driver_id.eq.${id}`)
    const r3 = await supabase.from('profiles').delete().eq('id', id)
    console.log('deleteUser errors:', r1.error, r2.error, r3.error)
    if (r3.error) { alert('Ошибка: ' + r3.error.message); return }
    setUsers(prev => prev.filter(u => u.id !== id))
    setRequests(prev => prev.filter(r => r.client_id !== id && r.driver_id !== id))
    setDeleteConfirm(null)
  }

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || '—'

  // Stats
  const stats = {
    totalUsers: users.length,
    clients: users.filter(u => u.role === 'client').length,
    drivers: users.filter(u => u.role === 'driver').length,
    totalRequests: requests.length,
    open: requests.filter(r => r.status === 'open').length,
    active: requests.filter(r => r.status === 'accepted' || r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  }

  const filteredUsers = users.filter(u => {
    const q = searchUsers.toLowerCase()
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.phone?.includes(q)
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const filteredRequests = requests.filter(r => {
    const q = searchRequests.toLowerCase()
    const matchSearch = !q || r.from_location?.toLowerCase().includes(q) || r.to_location?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    return matchSearch && matchStatus
  })

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <div>
            <span className="font-black text-lg tracking-tight">GazelleGo</span>
            <span className="ml-2 text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-zinc-500 hover:text-white text-sm transition-colors"
        >
          ← К дашборду
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 bg-zinc-950 border border-zinc-900 rounded-xl w-fit">
          {[
            { key: 'stats', label: '📊 Статистика' },
            { key: 'users', label: `👥 Пользователи (${users.length})` },
            { key: 'requests', label: `📋 Заявки (${requests.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* STATS TAB */}
        {tab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Всего пользователей', value: stats.totalUsers, icon: '👥', color: 'text-white' },
                { label: 'Клиентов', value: stats.clients, icon: '📦', color: 'text-amber-400' },
                { label: 'Водителей', value: stats.drivers, icon: '🚛', color: 'text-blue-400' },
                { label: 'Всего заявок', value: stats.totalRequests, icon: '📋', color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
                  <div className="text-2xl mb-3">{s.icon}</div>
                  <div className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</div>
                  <div className="text-zinc-500 text-sm">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Ожидают водителя', value: stats.open, color: 'text-yellow-400', bg: 'border-yellow-500/20' },
                { label: 'В работе / В пути', value: stats.active, color: 'text-blue-400', bg: 'border-blue-500/20' },
                { label: 'Выполнено', value: stats.completed, color: 'text-green-400', bg: 'border-green-500/20' },
                { label: 'Отменено', value: stats.cancelled, color: 'text-red-400', bg: 'border-red-500/20' },
              ].map(s => (
                <div key={s.label} className={`bg-zinc-950 border rounded-2xl p-6 ${s.bg}`}>
                  <div className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</div>
                  <div className="text-zinc-500 text-sm">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent requests */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
              <h2 className="font-black text-lg mb-4">Последние заявки</h2>
              <div className="space-y-2">
                {requests.slice(0, 8).map(req => {
                  const st = statusLabel[req.status] || statusLabel.open
                  return (
                    <div key={req.id} className="flex items-center justify-between py-2 border-b border-zinc-900 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">#{req.order_number || '—'}</span>
                        <span className="text-sm font-medium">{req.from_location} → {req.to_location}</span>
                        <span className="text-xs text-zinc-500">{getUserName(req.client_id)}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div>
            <div className="flex gap-3 mb-5 flex-wrap">
              <input
                value={searchUsers}
                onChange={e => setSearchUsers(e.target.value)}
                placeholder="Поиск по имени или телефону..."
                className="bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 outline-none text-sm flex-1 min-w-48"
              />
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
                <option value="all">Все роли</option>
                <option value="client">Клиенты</option>
                <option value="driver">Водители</option>
              </select>
            </div>

            <div className="space-y-2">
              {filteredUsers.map(user => {
                const userReqs = requests.filter(r => r.client_id === user.id || r.driver_id === user.id)
                const completed = userReqs.filter(r => r.status === 'completed').length
                return (
                  <div key={user.id} className="bg-zinc-950 border border-zinc-900 hover:border-zinc-700 rounded-2xl p-5 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg shrink-0">
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white">{user.name || 'Без имени'}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${user.role === 'driver' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                              {user.role === 'driver' ? '🚛 Водитель' : '📦 Клиент'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-zinc-500">
                            {user.phone && <span>📞 {user.phone}</span>}
                            {user.car_model && <span>🚗 {user.car_model}</span>}
                            <span>Заявок: {userReqs.length} / Выполнено: {completed}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'user', id: user.id, name: user.name || 'Без имени' })}
                        className="text-zinc-600 hover:text-red-400 transition-colors text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                      >
                        🗑 Удалить
                      </button>
                    </div>
                  </div>
                )
              })}
              {filteredUsers.length === 0 && (
                <div className="text-center py-16 text-zinc-600">Пользователи не найдены</div>
              )}
            </div>
          </div>
        )}

        {/* REQUESTS TAB */}
        {tab === 'requests' && (
          <div>
            <div className="flex gap-3 mb-5 flex-wrap">
              <input
                value={searchRequests}
                onChange={e => setSearchRequests(e.target.value)}
                placeholder="Поиск по маршруту..."
                className="bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 outline-none text-sm flex-1 min-w-48"
              />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
                <option value="all">Все статусы</option>
                <option value="open">Ожидает</option>
                <option value="accepted">В работе</option>
                <option value="in_progress">В пути</option>
                <option value="completed">Выполнено</option>
                <option value="cancelled">Отменено</option>
              </select>
            </div>

            <div className="space-y-2">
              {filteredRequests.map(req => {
                const st = statusLabel[req.status] || statusLabel.open
                const client = users.find(u => u.id === req.client_id)
                const driver = users.find(u => u.id === req.driver_id)
                return (
                  <div key={req.id} className="bg-zinc-950 border border-zinc-900 hover:border-zinc-700 rounded-2xl p-5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">#{req.order_number || '—'}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                          {req.cargo_type && <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">{cargoLabel[req.cargo_type] || req.cargo_type}</span>}
                          <span className="text-xs text-zinc-600">{new Date(req.created_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <div className="font-bold text-white mb-2">{req.from_location} → {req.to_location}</div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500 flex-wrap">
                          <span>👤 Клиент: <span className="text-zinc-300">{client?.name || '—'}</span>{client?.phone ? ` · ${client.phone}` : ''}</span>
                          {driver && <span>🚛 Водитель: <span className="text-zinc-300">{driver.name}</span>{driver.phone ? ` · ${driver.phone}` : ''}</span>}
                          {req.price && <span className="text-green-400 font-semibold">💰 {Number(req.price).toLocaleString()} ₸</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'request', id: req.id, name: `${req.from_location} → ${req.to_location}` })}
                        className="text-zinc-600 hover:text-red-400 transition-colors text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 shrink-0"
                      >
                        🗑 Удалить
                      </button>
                    </div>
                  </div>
                )
              })}
              {filteredRequests.length === 0 && (
                <div className="text-center py-16 text-zinc-600">Заявки не найдены</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-2xl mb-3">⚠️</div>
            <h2 className="text-lg font-black text-white mb-2">Подтвердите удаление</h2>
            <p className="text-zinc-400 text-sm mb-1">
              {deleteConfirm.type === 'user' ? 'Пользователь' : 'Заявка'}:
            </p>
            <p className="text-white font-semibold mb-4 bg-zinc-900 rounded-xl px-4 py-2 text-sm">{deleteConfirm.name}</p>
            {deleteConfirm.type === 'user' && (
              <p className="text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                Будут удалены все заявки, сообщения и отзывы этого пользователя
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                Отмена
              </button>
              <button
                onClick={() => deleteConfirm.type === 'user' ? deleteUser(deleteConfirm.id) : deleteRequest(deleteConfirm.id)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}