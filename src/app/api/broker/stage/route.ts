import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrokerProfile, updateLeadStage, addBrokerActivity } from '@/lib/broker'
import { limits } from '@/lib/rateLimit'

const VALID_STAGES = ['new', 'contacted', 'visit_scheduled', 'negotiating', 'won', 'lost']

export async function POST(req: NextRequest) {
  const rl = limits.public(req)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getBrokerProfile(user.id)
  if (!profile) return NextResponse.json({ error: 'Not a broker' }, { status: 403 })

  const { assignmentId, leadId, stage } = await req.json() as {
    assignmentId: string; leadId: string; stage: string
  }

  if (!assignmentId || !leadId || !VALID_STAGES.includes(stage)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const ok = await updateLeadStage(assignmentId, stage)
  if (!ok) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  await addBrokerActivity({
    assignmentId,
    leadId,
    brokerId: profile.id,
    orgId: profile.org_id,
    type: 'stage_change',
    note: `Stage moved to ${stage.replace(/_/g, ' ')}`,
  })

  return NextResponse.json({ ok: true })
}
