'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreateRequest() {
    const router = useRouter()
    const [form, setForm] = useState({
        departure: '', destination: '', description: '', datetime: '', price: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const { error } = await supabase.from('requests').insert([{
            client_id: user.id,
            ...form,
            price: form.price ? parseFloat(form.price) : null
        }])

        if (error) alert(error.message)
        else router.push('/dashboard')
    }

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-black">Новая заявка на перевозку</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Откуда" className="w-full p-2 border rounded text-black"
                    onChange={e => setForm({ ...form, departure: e.target.value })} required />
                <input type="text" placeholder="Куда" className="w-full p-2 border rounded text-black"
                    onChange={e => setForm({ ...form, destination: e.target.value })} required />
                <textarea placeholder="Что везем? Описание груза" className="w-full p-2 border rounded text-black"
                    onChange={e => setForm({ ...form, description: e.target.value })} required />
                <input type="datetime-local" className="w-full p-2 border rounded text-black"
                    onChange={e => setForm({ ...form, datetime: e.target.value })} required />
                <input type="number" placeholder="Предлагаемая цена (₽) - по желанию" className="w-full p-2 border rounded text-black"
                    onChange={e => setForm({ ...form, price: e.target.value })} />

                <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
                    Опубликовать заявку
                </button>
            </form>
        </div>
    )
}
