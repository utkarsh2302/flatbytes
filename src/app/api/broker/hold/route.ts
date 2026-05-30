import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrokerProfile } from '@/lib/broker'
import { limits } from '@/lib/rateLimit'

const HOLD_HOURS = 48

export async function POST(req: NextRequest) {
  const rl = limits.public(req)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getBrokerProfile(user.id)
  if (!profile) return NextResponse.json({ error: 'Not a broker' }, { status: 403 })

  const { flatId, clientName, release } = await req.json() as {
    flatId: string; clientName?: string; release?: boolean
  }

  if (!flatId) return NextResponse.json({ error: 'flatId required' }, { status: 400 })

  // eslint-disable-next-line
  const db = supabase as any

  const { data: flat } = await db
    .from('flats')
    .select('id, status, held_by_broker_id, held_until')
    .eq('id', flatId)
    .single()

  if (!flat) return NextResponse.json({ error: 'Flat not found' }, { status: 404 })

  if (release) {
    if (flat.held_by_broker_id !== profile.id) {
      return NextResponse.json({ error: 'Not your hold' }, { status: 403 })
    }
    await db.from('flats').update({
      status: 'available',
      held_by_broker_id: null,
      held_until: null,
      held_for_client_name: null,
    }).eq('id', flatId)
    return NextResponse.json({ ok: true, released: true })
  }

  const holdExpired = flat.held_until && new Date(flat.held_until) < new Date()
  if (flat.status === 'sold' || flat.status === 'reserved') {
    return NextResponse.json({ error: 'Flat is not available for hold' }, { status: 409 })
  }
  if (flat.held_by_broker_id && flat.held_by_broker_id !== profile.id && !holdExpired) {
    return NextResponse.json({ error: 'Flat is already held by another broker' }, { status: 409 })
  }

  const heldUntil = new Date(Date.now() + HOLD_HOURS * 60 * 60 * 1000).toISOString()

  await db.from('flats').update({
    status: 'held',
    held_by_broker_id: profile.id,
    held_until: heldUntil,
    held_for_client_name: clientName ?? null,
  }).eq('id', flatId)

  return NextResponse.json({ ok: true, heldUntil })
}
