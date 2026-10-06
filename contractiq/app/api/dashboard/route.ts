import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { DashboardContract } from '@/types'

export const GET = withAuth(async (_req: NextRequest, user) => {
  const supabase = await createServerSupabaseClient()

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, name, contract_type, status, page_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: termRows } = await supabase
    .from('key_terms')
    .select('contract_id')
    .eq('user_id', user.id)

  const countMap: Record<string, number> = {}
  termRows?.forEach((r) => { countMap[r.contract_id] = (countMap[r.contract_id] ?? 0) + 1 })

  const rows: DashboardContract[] = (contracts ?? []).map((c) => ({
    ...c,
    term_count: countMap[c.id] ?? 0,
  }))

  const stats = {
    total: rows.length,
    processed: rows.filter((c) => c.status === 'processed').length,
    processing: rows.filter((c) => c.status === 'processing').length,
    error: rows.filter((c) => c.status === 'error').length,
  }

  return NextResponse.json({ contracts: rows, stats })
})
