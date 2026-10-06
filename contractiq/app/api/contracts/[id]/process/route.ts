import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { extractKeyTerms } from '@/lib/openai/extract'

const MAX_TOKENS = parseInt(process.env.MAX_CONTRACT_TOKENS ?? '15000', 10)

export const POST = withAuth(async (req: NextRequest, user, { params }) => {
  const contractId = params.id
  const supabase = await createServerSupabaseClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('id, user_id, contract_type, contract_text, status')
    .eq('id', contractId)
    .single()

  if (error || !contract) {
    return NextResponse.json({ message: 'Contract not found.' }, { status: 404 })
  }
  if (contract.user_id !== user.id) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 })
  }
  if (contract.status !== 'uploaded') {
    return NextResponse.json({ code: 'ALREADY_PROCESSED', message: 'This contract has already been processed.' }, { status: 400 })
  }

  const tokenEstimate = Math.ceil(contract.contract_text.length / 4)
  if (tokenEstimate > MAX_TOKENS) {
    return NextResponse.json({ code: 'CONTRACT_TOO_LONG', message: 'Contract exceeds the 15,000-token limit.' }, { status: 422 })
  }

  await supabase.from('contracts').update({ status: 'processing' }).eq('id', contractId)

  const { data: customTermRows } = await supabase
    .from('custom_key_terms')
    .select('term_name')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: true })

  const customTermNames = customTermRows?.map((r) => r.term_name) ?? []

  let keyTermResults
  try {
    keyTermResults = await extractKeyTerms(contract.contract_text, contract.contract_type, customTermNames)
  } catch (err: unknown) {
    await supabase.from('contracts').update({ status: 'error' }).eq('id', contractId)
    const code = (err as { code?: string }).code === 'AI_PARSE_FAILED' ? 'AI_PARSE_FAILED' : 'AI_UNAVAILABLE'
    const status = code === 'AI_PARSE_FAILED' ? 502 : 503
    return NextResponse.json({ code, message: 'AI extraction failed. Your document is saved — please retry.' }, { status })
  }

  const rows = keyTermResults.map((term) => ({
    contract_id: contractId,
    user_id: user.id,
    term_name: term.term_name,
    value: term.value,
    page_number: term.page_number,
    confidence_score: term.confidence_score,
    source_sentence: term.source_sentence,
    is_custom: customTermNames.includes(term.term_name),
    is_edited: false,
  }))

  await supabase.from('key_terms').insert(rows)
  await supabase.from('contracts').update({ status: 'processed' }).eq('id', contractId)

  const { data: inserted } = await supabase.from('key_terms').select('*').eq('contract_id', contractId)

  return NextResponse.json({
    contract_id: contractId,
    status: 'processed',
    key_terms: inserted ?? [],
  })
})
