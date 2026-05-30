import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrokerProfile, addBrokerActivity } from '@/lib/broker'
import { limits } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const rl = limits.public(req)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getBrokerProfile(user.id)
  if (!profile) return NextResponse.json({ error: 'Not a broker' }, { status: 403 })

  const body = await req.json()
  const { leadId, assignmentId, type, note } = body as {
    leadId: string; assignmentId?: string; type: string; note: string
  }

  if (!leadId || !type || !note) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const activity = await addBrokerActivity({
    leadId,
    assignmentId,
    brokerId: profile.id,
    orgId: profile.org_id,
    type: type as 'call' | 'whatsapp' | 'site_visit' | 'note' | 'stage_change',
    note,
  })

  if (!activity) return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
  return NextResponse.json({ activity })
}
