import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Minimal Web Push without heavy lib — manual JWT + encryption via node crypto
async function sendPush(subscription: any, payload: object) {
  const webpush = await import('web-push')
  webpush.setVapidDetails(
    'mailto:admin@gazelle-go.vercel.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  await webpush.sendNotification(subscription, JSON.stringify(payload))
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, url } = await req.json()
    if (!userId || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single()

    if (!data) return NextResponse.json({ error: 'No subscription' }, { status: 404 })

    await sendPush(JSON.parse(data.subscription), { title, body, url: url || '/dashboard' })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    // 410 Gone = subscription expired, clean it up
    if (e?.statusCode === 410) {
      const { userId } = await req.json().catch(() => ({}))
      if (userId) await supabase.from('push_subscriptions').delete().eq('user_id', userId)
    }
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}
