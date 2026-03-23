'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [profile, setProfile] = useState<any>(null)
  const [request, setRequest] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { init() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    const { data: req } = await supabase.from('requests').select('*').eq('id', requestId).single()
    setRequest(req)

    await loadMessages()
    setLoading(false)

    // Realtime subscription
    const channel = supabase.channel(`chat:${requestId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` },
        () => loadMessages()
      ).subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  const loadMessages = async () => {
    const { data } = await supabase.from('messages')
      .select('*, profiles(name)')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !profile) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('messages').insert([{ request_id: requestId, sender_id: user.id, text: text.trim() }])
    setText('')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-900 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-zinc-500 hover:text-white transition-colors">←</Link>
        <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 font-bold text-lg">
          🚛
        </div>
        <div>
          <div className="font-bold text-sm">
            {request?.departure} → {request?.destination}
          </div>
          <div className="text-zinc-500 text-xs">{request?.description?.slice(0, 50)}...</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-600 py-16">
            <div className="text-4xl mb-3">💬</div>
            <p>Начните общение</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === profile?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isMe && (
                  <span className="text-xs text-zinc-500 px-1">{msg.profiles?.name || 'Пользователь'}</span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                  ? 'bg-amber-500 text-black font-medium rounded-br-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-white rounded-bl-sm'}`}>
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

      {/* Input */}
      <div className="bg-zinc-950 border-t border-zinc-900 p-4">
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Написать сообщение..."
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition-colors text-sm"
          />
          <button type="submit" disabled={!text.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-bold w-12 h-12 rounded-xl transition-colors flex items-center justify-center shrink-0">
            →
          </button>
        </form>
      </div>
    </div>
  )
}
