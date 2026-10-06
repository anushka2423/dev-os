import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendChatMessage } from '@/lib/openai/chat'
import { SendChatMessageSchema } from '@/lib/validation/schemas'

export const POST = withAuth(async (req: NextRequest, user, { params }) => {
  const contractId = params.contractId
  const body = await req.json()
  const parsed = SendChatMessageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ code: 'INVALID_MESSAGE', message: parsed.error.errors[0].message }, { status: 400 })
  }

  const { session_id: sessionId, message } = parsed.data
  const supabase = await createServerSupabaseClient()

  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('id, user_id, contract_id')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ code: 'SESSION_NOT_FOUND', message: 'Chat session not found.' }, { status: 404 })
  }
  if (session.user_id !== user.id || session.contract_id !== contractId) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 })
  }

  const { data: contract } = await supabase
    .from('contracts')
    .select('contract_type, contract_text, status')
    .eq('id', contractId)
    .single()

  if (!contract || contract.status !== 'processed') {
    return NextResponse.json({ code: 'CONTRACT_NOT_PROCESSED', message: 'Contract has not been processed yet.' }, { status: 422 })
  }

  const { data: historyRows } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(200)

  const history = (historyRows ?? []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  let result: { content: string; pageCitations: number[] }
  try {
    result = await sendChatMessage(contract.contract_text, contract.contract_type, history, message)
  } catch {
    return NextResponse.json({ code: 'AI_UNAVAILABLE', message: 'AI service is temporarily unavailable. Please try again.' }, { status: 502 })
  }

  const messageId = crypto.randomUUID()
  await supabase.from('chat_messages').insert([
    { session_id: sessionId, user_id: user.id, role: 'user', content: message, page_citations: [] },
    { id: messageId, session_id: sessionId, user_id: user.id, role: 'assistant', content: result.content, page_citations: result.pageCitations },
  ])

  return NextResponse.json({
    message_id: messageId,
    role: 'assistant',
    content: result.content,
    page_citations: result.pageCitations,
    created_at: new Date().toISOString(),
  })
})

export const GET = withAuth(async (req: NextRequest, user, { params }) => {
  const contractId = params.contractId
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ message: 'session_id is required.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id, user_id, contract_id')
    .eq('id', sessionId)
    .single()

  if (!session || session.user_id !== user.id || session.contract_id !== contractId) {
    return NextResponse.json({ message: 'Session not found or forbidden.' }, { status: 404 })
  }

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, role, content, page_citations, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  return NextResponse.json({ session_id: sessionId, messages: messages ?? [] })
})
