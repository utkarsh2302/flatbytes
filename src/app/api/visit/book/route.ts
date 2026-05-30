import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { limits } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const rl = limits.public(req)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json()
  const { projectId, flatId, orgId, visitorName, visitorPhone, preferredDate, preferredSlot } = body

  if (!projectId || !visitorName || !visitorPhone || !preferredDate || !preferredSlot) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!/^\d{10}$/.test(visitorPhone.replace(/\s/g, ''))) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  const supabase = createClient()
  // eslint-disable-next-line
  const db = supabase as any

  let resolvedOrgId = orgId
  if (!resolvedOrgId) {
    const { data: proj } = await supabase.from('projects').select('org_id').eq('id', projectId).single()
    resolvedOrgId = (proj as any)?.org_id ?? null
  }

  const { data, error } = await db.from('visit_bookings').insert({
    project_id: projectId,
    flat_id: flatId ?? null,
    org_id: resolvedOrgId ?? null,
    visitor_name: visitorName,
    visitor_phone: visitorPhone,
    preferred_date: preferredDate,
    preferred_slot: preferredSlot,
    status: 'pending',
  }).select('id').single()

  if (error) {
    console.error('visit_bookings insert error:', error)
    return NextResponse.json({ error: 'Failed to book visit' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
