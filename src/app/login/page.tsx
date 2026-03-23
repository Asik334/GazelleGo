'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Dashboard() {
    const [requests, setRequests] = useState<any[]>([])
    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(userProfile)

        if (userProfile?.role === 'client') {
            // Клиент видит только свои заявки
            const { data } = await supabase.from('requests').select('*').eq('client_id', user.id).order('created_at', { ascending: false })
            setRequests(data || [])
        } else {
            // Водитель видит доступные (pending) и свои принятые
            const { data } = await supabase.from('requests').select('*')
                .or(`status.eq.pending,driver_id.eq.${user.id}`)
                .order('created_at', { ascending: false })
            setRequests(data || [])
        }
    }

    const handleAcceptRequest = async (requestId: string) => {
        if (!profile) return
        const { error } = await supabase.from('requests')
            .update({ status: 'accepted', driver_id: profile.id })
            .eq('id', requestId)

        if (!error) fetchData()
    }

    return (
        <div className="max-w-5xl mx-auto mt-10 p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Лента заявок ({profile?.role === 'client' ? 'Мои заказы' : 'Биржа грузов'})</h1>
                {profile?.role === 'client' && (
                    <Link href="/dashboard/create" className="bg-blue-600 text-white px-4 py-2 rounded">
                        + Создать заявку
                    </Link>
                )}
            </div>

            <div className="grid gap-4">
                {requests.map(req => (
                    <div key={req.id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center text-black">
                        <div>
                            <p className="font-bold text-lg">{req.departure} ➔ {req.destination}</p>
                            <p className="text-sm text-gray-600">{new Date(req.datetime).toLocaleString()}</p>
                            <p className="mt-2">{req.description}</p>
                            {req.price && <p className="mt-1 font-semibold text-green-600">Цена: {req.price} ₽</p>}
                            <span className={`inline-block mt-2 px-2 py-1 text-xs rounded text-white ${req.status === 'pending' ? 'bg-yellow-500' : req.status === 'accepted' ? 'bg-blue-500' : 'bg-gray-500'}`}>
                                {req.status === 'pending' ? 'Ожидает водителя' : req.status === 'accepted' ? 'В работе' : 'Выполнено'}
                            </span>
                        </div>

                        {profile?.role === 'driver' && req.status === 'pending' && (
                            <button onClick={() => handleAcceptRequest(req.id)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                Принять заказ
                            </button>
                        )}
                        {profile?.role === 'driver' && req.status === 'accepted' && req.driver_id === profile.id && (
                            <button disabled className="bg-gray-300 text-gray-600 px-4 py-2 rounded">
                                Вы приняли
                            </button>
                        )}
                    </div>
                ))}
                {requests.length === 0 && <p>Заявок пока нет.</p>}
            </div>
        </div>
    )
}
