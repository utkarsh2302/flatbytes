import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrokerProfile } from '@/lib/broker'
import { limits } from '@/lib/rateLimit'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const rl = limits.heavy(req)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getBrokerProfile(user.id)
  if (!profile) return NextResponse.json({ error: 'Not a broker' }, { status: 403 })

  const { leadName, projectName, stage, lastNote } = await req.json() as {
    leadName: string; projectName: string; stage: string; lastNote?: string
  }

  const stageContext: Record<string, string> = {
    new: 'first contact — introduce yourself and the project',
    contacted: 'already spoke once — follow up to set up a site visit',
    visit_scheduled: 'site visit is upcoming — send a reminder and share what to expect',
    negotiating: 'in price discussions — keep them engaged and address concerns',
    lost: 're-engage — check if their situation has changed',
  }

  const context = stageContext[stage] ?? 'general follow-up'

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: 'You write short, friendly WhatsApp messages for real estate brokers in India. Keep it under 3 sentences, casual, no emojis overload (1–2 max), no marketing speak. Never mention price — always say "price on request" or "happy to share details". Write in English.',
    messages: [{
      role: 'user',
      content: `Write a WhatsApp follow-up message for:
Lead: ${leadName}
Project: ${projectName}
Stage: ${context}
${lastNote ? `Last note: ${lastNote}` : ''}
Broker name: ${profile.name}`
    }]
  })

  const text = (message.content[0] as { type: string; text: string }).text ?? ''
  return NextResponse.json({ message: text })
}
