'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const cargoLabel: Record<string, string> = {
  general:   '📦 Обычный груз',
  fragile:   '🫧 Хрупкий груз',
  heavy:     '🏋️ Тяжёлый груз',
  furniture: '🛋️ Мебель',
  food:      '🍎 Продукты',
}

const statusLabel: Record<string, string> = {
  open:        'Ожидает водителя',
  accepted:    'В работе',
  in_progress: 'В пути',
  completed:   'Выполнено',
  cancelled:   'Отменено',
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [profile, setProfile] = useState<any>(null)
  const [request, setRequest] = useState<any>(null)
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [senderNames, setSenderNames] = useState<Record<string, string>>({})
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const senderNamesRef = useRef<Record<string, string>>({})

  // Keep ref in sync for use inside closures
  useEffect(() => { senderNamesRef.current = senderNames }, [senderNames])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })

    if (error) { console.error('loadMessages error:', error); return }

    const msgs = data || []
    setMessages(msgs)

    const uniqueIds = [...new Set(msgs.map((m: any) => m.sender_id).filter(Boolean))]
    if (uniqueIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles').select('id, name').in('id', uniqueIds)
      const namesMap: Record<string, string> = {}
      for (const p of profilesData || []) namesMap[p.id] = p.name
      setSenderNames(namesMap)
    }
  }, [requestId])

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { data: req, error: reqError } = await supabase
        .from('requests').select('*').eq('id', requestId).single()
      if (reqError || !req) {
        router.push('/dashboard')
        return
      }
      setRequest(req)

      if (req.client_id) {
        const { data: clientData } = await supabase
          .from('profiles').select('name, phone').eq('id', req.client_id).single()
        setClientInfo(clientData)
      }

      await loadMessages()
      setLoading(false)
      // Scroll to bottom instantly on first load
      setTimeout(() => scrollToBottom('instant' as ScrollBehavior), 50)

      // Realtime subscription
      const channel = supabase.channel(`chat_room_${requestId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `request_id=eq.${requestId}`,
        }, async (payload) => {
          const newMsg = payload.new as any
          if (newMsg.sender_id && !senderNamesRef.current[newMsg.sender_id]) {
            const { data: senderData } = await supabase
              .from('profiles').select('name').eq('id', newMsg.sender_id).single()
            if (senderData) {
              setSenderNames(prev => ({ ...prev, [newMsg.sender_id]: senderData.name }))
            }
          }
          setMessages(prev => {
            // Deduplicate (optimistic updates)
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        })
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
    }

    init()
    return () => { cleanup?.() }
  }, [requestId, router, loadMessages, scrollToBottom])

  const sendMessage = async () => {
    const trimmed = text.trim()
    if (!trimmed || !profile || sending) return

    setSending(true)
    setSendError('')
    setText('')

    // Optimistic update
    const optimisticMsg = {
      id: `optimistic-${Date.now()}`,
      request_id: requestId,
      sender_id: profile.id,
      text: trimmed,
      created_at: new Date().toISOString(),
      optimistic: true,
    }
    setMessages(prev => [...prev, optimisticMsg])

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }

    const { error } = await supabase.from('messages').insert([{
      request_id: requestId,
      sender_id: user.id,
      text: trimmed,
    }])

    if (error) {
      setSendError('Не удалось отправить. Попробуйте ещё раз.')
      setText(trimmed)
      // Remove optimistic message
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
    }

    setSending(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) return (
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col">
      {/* Header skeleton */}
      <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="w-10 h-10 bg-zinc-800 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse mb-1.5" />
          <div className="h-3 w-32 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="spinner" />
      </div>
    </div>
  )

  const orderNum = request?.order_number || '—'

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white flex flex-col">

      {/* ── Chat Header ──────────────────────────────── */}
      <header className="bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex items-center gap-3 shrink-0 sticky top-0 z-10">
        <Link
          href="/dashboard"
          aria-label="Назад"
          className="text-zinc-500 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-xl"
        >
          ←
        </Link>
        <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center text-lg shrink-0" aria-hidden>
          🚛
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm flex items-center gap-1.5 min-w-0">
            <span className="text-zinc-500 font-mono text-xs shrink-0">№{orderNum}</span>
            <span className="truncate">
              {request?.from_location} → {request?.to_location}
            </span>
          </div>
          <div className="text-zinc-500 text-xs truncate">
            {cargoLabel[request?.cargo_type] || 'Груз'} · {request?.price ? `${Number(request.price).toLocaleString()} ₸` : 'Договорная'}
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          aria-label="Детали заявки"
          className={`text-xs shrink-0 px-3 py-1.5 border rounded-xl transition-colors min-h-[44px] flex items-center
            ${showDetails
              ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
              : 'border-zinc-800 text-zinc-500 hover:text-amber-400'
            }`}
        >
          {showDetails ? '✕' : 'ℹ️'}
        </button>
      </header>

      {/* ── Details Panel ────────────────────────────── */}
      {showDetails && (
        <div className="bg-zinc-950 border-b border-zinc-900 shrink-0 animate-in">
          <div className="px-4 py-4 space-y-4 max-h-[50dvh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Откуда', value: request?.from_location },
                { label: 'Куда', value: request?.to_location },
                { label: 'Тип груза', value: cargoLabel[request?.cargo_type] || '—' },
                { label: 'Дата', value: request?.datetime ? new Date(request.datetime).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' },
                { label: 'Цена', value: request?.price ? `${Number(request.price).toLocaleString()} ₸` : 'Договорная', green: true },
                { label: 'Статус', value: statusLabel[request?.status] || request?.status, blue: true },
              ].map(({ label, value, green, blue }) => (
                <div key={label}>
                  <div className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">{label}</div>
                  <div className={`font-medium ${green ? 'text-green-400' : blue ? 'text-blue-400' : 'text-white'}`}>{value}</div>
                </div>
              ))}
            </div>

            {request?.description && (
              <div>
                <div className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Описание</div>
                <div className="text-zinc-300 text-sm leading-relaxed">{request.description}</div>
              </div>
            )}

            {clientInfo && (
              <div className="border-t border-zinc-900 pt-3">
                <div className="text-zinc-600 text-xs uppercase tracking-wider mb-2">Контакт клиента</div>
                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                    {clientInfo.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm">{clientInfo.name || 'Клиент'}</div>
                    {clientInfo.phone && (
                      <a href={`tel:${clientInfo.phone}`}
                        className="text-amber-400 text-sm hover:text-amber-300 transition-colors min-h-[44px] flex items-center">
                        📞 {clientInfo.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Messages Area ─────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-2"
        role="log"
        aria-live="polite"
        aria-label="Сообщения чата"
      >
        {messages.length === 0 && (
          <div className="text-center text-zinc-600 py-16 fade-in">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">Напишите первое сообщение</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === profile?.id
          const prevMsg = messages[i - 1]
          const showName = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id)
          const nextMsg = messages[i + 1]
          const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id
          const senderName = senderNames[msg.sender_id] || 'Пользователь'
          const isOptimistic = msg.optimistic

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                {showName && (
                  <span className="text-xs text-zinc-500 px-1 mb-0.5">{senderName}</span>
                )}
                <div className={`px-4 py-2.5 text-sm leading-relaxed break-words max-w-full
                  ${isMe
                    ? `bg-amber-500 text-black font-medium rounded-2xl ${isLastInGroup ? 'rounded-br-sm' : ''} ${isOptimistic ? 'opacity-70' : ''}`
                    : `bg-zinc-900 border border-zinc-800 text-white rounded-2xl ${isLastInGroup ? 'rounded-bl-sm' : ''}`
                  }`}
                >
                  {msg.text}
                </div>
                {isLastInGroup && (
                  <span className="text-xs text-zinc-700 px-1">
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Error Banner ─────────────────────────────── */}
      {sendError && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs shrink-0 flex items-center justify-between gap-2">
          <span>{sendError}</span>
          <button onClick={() => setSendError('')} className="text-red-400/60 hover:text-red-400 min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
        </div>
      )}

      {/* ── Message Input ─────────────────────────────── */}
      <div
        className="bg-zinc-950 border-t border-zinc-900 px-3 py-3 shrink-0 safe-area-bottom"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex gap-2 items-center max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение..."
            aria-label="Написать сообщение"
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-base min-h-[48px]"
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            aria-label="Отправить сообщение"
            className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold w-12 h-12 rounded-2xl transition-colors flex items-center justify-center shrink-0 text-xl"
          >
            {sending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}
