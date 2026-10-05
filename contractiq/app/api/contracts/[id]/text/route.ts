import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const GET = withAuth(async (_req: NextRequest, user, { params }: { params: { id: string } }) => {
  const supabase = createServerSupabaseClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('contract_text, user_id')
    .eq('id', params.id)
    .single()

  if (error || !contract) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 })
  }
  if (contract.user_id !== user.id) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 })
  }

  return NextResponse.json({ contract_text: contract.contract_text })
})
