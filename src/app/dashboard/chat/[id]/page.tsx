'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [showDetails, setShowDetails] = useState(false)
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { init() }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    const { data: req, error: reqError } = await supabase
      .from('requests').select('*').eq('id', requestId).single()
    if (reqError || !req) {
      alert('Заявка не найдена: ' + reqError?.message)
      router.push('/dashboard')
      return
    }
    setRequest(req)

    // Load client profile info
    if (req.client_id) {
      const { data: clientData } = await supabase
        .from('profiles').select('name, phone').eq('id', req.client_id).single()
      setClientInfo(clientData)
    }

    await loadMessages()
    setLoading(false)

    // Realtime subscription
    const channel = supabase.channel(`chat_room_${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `request_id=eq.${requestId}`,
      }, async (payload) => {
        const newMsg = payload.new as any
        // Fetch sender name if not cached
        if (newMsg.sender_id && !senderNames[newMsg.sender_id]) {
          const { data: senderData } = await supabase
            .from('profiles').select('name').eq('id', newMsg.sender_id).single()
          if (senderData) {
            setSenderNames(prev => ({ ...prev, [newMsg.sender_id]: senderData.name }))
          }
        }
        setMessages(prev => [...prev, newMsg])
      })
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })

    return () => { supabase.removeChannel(channel) }
  }

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('loadMessages error:', error)
      return
    }

    const msgs = data || []
    setMessages(msgs)

    // Load all sender names
    const uniqueSenderIds = [...new Set(msgs.map((m: any) => m.sender_id).filter(Boolean))]
    if (uniqueSenderIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles').select('id, name').in('id', uniqueSenderIds)
      const namesMap: Record<string, string> = {}
      for (const p of profilesData || []) {
        namesMap[p.id] = p.name
      }
      setSenderNames(namesMap)
    }
  }

  const sendMessage = async () => {
    const trimmed = text.trim()
    if (!trimmed || !profile) return
    setSendError('')
    setText('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('messages').insert([{
      request_id: requestId,
      sender_id: user.id,
      text: trimmed,
    }])

    if (error) {
      setSendError('Ошибка: ' + error.message)
      setText(trimmed)
      console.error('sendMessage error:', error)
    }
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const orderNum = request?.order_number || '—'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">

      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/dashboard" className="text-zinc-500 hover:text-white transition-colors text-xl w-8 shrink-0">←</Link>
        <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center text-lg shrink-0">🚛</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate flex items-center gap-2">
            <span className="text-zinc-500 font-mono text-xs">№{orderNum}</span>
            <span>{request?.from_location} → {request?.to_location}</span>
          </div>
          <div className="text-zinc-500 text-xs truncate">
            {cargoLabel[request?.cargo_type] || 'Груз'} · {request?.price ? Number(request.price).toLocaleString() + ' ₸' : 'Договорная'}
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`text-xs shrink-0 px-3 py-1.5 border rounded-lg transition-colors ${showDetails ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : 'border-zinc-800 text-zinc-500 hover:text-amber-400'}`}
        >
          {showDetails ? '✕ Закрыть' : 'ℹ️ Детали'}
        </button>
      </div>

      {/* Details panel */}
      {showDetails && (
        <div className="bg-zinc-950 border-b border-zinc-900 shrink-0">
          <div className="px-4 py-4 space-y-4">
            {/* Order info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">Откуда</div>
                <div className="text-white font-medium">{request?.from_location}</div>
              </div>
              <div>
                <div className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">Куда</div>
                <div className="text-white font-medium">{request?.to_location}</div>
              </div>
              <div>
                <div className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">Тип груза</div>
                <div className="text-white">{cargoLabel[request?.cargo_type] || '—'}</div>
              </div>
              <div>
                <div className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">Дата</div>
                <div className="text-white">
                  {request?.datetime ? new Date(request.datetime).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
              </div>
              <div>
                <div className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">Цена</div>
                <div className="text-green-400 font-semibold">
                  {request?.price ? Number(request.price).toLocaleString() + ' ₸' : 'Договорная'}
                </div>
              </div>
              <div>
                <div className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">Статус</div>
                <div className="text-blue-400">{statusLabel[request?.status] || request?.status}</div>
              </div>
            </div>

            {request?.description && (
              <div>
                <div className="text-zinc-600 text-xs uppercase tracking-wider mb-0.5">Описание</div>
                <div className="text-zinc-300 text-sm">{request.description}</div>
              </div>
            )}

            {/* Client contact */}
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
                      <a href={`tel:${clientInfo.phone}`} className="text-amber-400 text-sm hover:text-amber-300 transition-colors">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-zinc-600 py-16">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">Напишите первое сообщение</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === profile?.id
          const prevMsg = messages[i - 1]
          const showName = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id)
          const senderName = senderNames[msg.sender_id] || 'Пользователь'

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {showName && (
                  <span className="text-xs text-zinc-500 px-1">{senderName}</span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                  isMe
                    ? 'bg-amber-500 text-black font-medium rounded-br-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-white rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-xs text-zinc-700 px-1">
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Send error */}
      {sendError && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs shrink-0">
          {sendError}
        </div>
      )}

      {/* Input */}
      <div className="bg-zinc-950 border-t border-zinc-900 p-3 shrink-0">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Написать сообщение... (Enter для отправки)"
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold w-12 h-12 rounded-xl transition-colors flex items-center justify-center shrink-0 text-lg"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
