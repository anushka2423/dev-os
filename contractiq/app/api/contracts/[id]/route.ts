import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const GET = withAuth(async (req: NextRequest, user, { params }) => {
  const contractId = params.id
  const supabase = await createServerSupabaseClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('id, user_id, name, contract_type, status, page_count, file_path, created_at')
    .eq('id', contractId)
    .single()

  if (error || !contract) {
    return NextResponse.json({ message: 'Contract not found.' }, { status: 404 })
  }
  if (contract.user_id !== user.id) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 })
  }

  const { data: keyTerms } = await supabase
    .from('key_terms')
    .select('*')
    .eq('contract_id', contractId)
    .order('page_number', { ascending: true })

  // Fetch or create chat session
  let chatSessionId: string

  const { data: existingSession } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('contract_id', contractId)
    .single()

  if (existingSession) {
    chatSessionId = existingSession.id
  } else {
    const { data: newSession } = await supabase
      .from('chat_sessions')
      .insert({ contract_id: contractId, user_id: user.id })
      .select('id')
      .single()
    chatSessionId = newSession!.id
  }

  // Generate signed URL if file_path exists
  let signedUrl: string | null = null
  if (contract.file_path) {
    const { data: urlData } = await supabase.storage
      .from('contracts')
      .createSignedUrl(contract.file_path, 3600)
    signedUrl = urlData?.signedUrl ?? null
  }

  return NextResponse.json({
    contract: {
      id: contract.id,
      name: contract.name,
      contract_type: contract.contract_type,
      status: contract.status,
      page_count: contract.page_count,
      created_at: contract.created_at,
      signed_url: signedUrl,
    },
    key_terms: keyTerms ?? [],
    chat_session_id: chatSessionId,
  })
})
