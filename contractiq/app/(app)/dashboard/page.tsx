import { createServerSupabaseClient } from '@/lib/supabase/server'
import PageContainer from '@/components/layout/page-container'
import DashboardHeader from '@/components/dashboard/dashboard-header'
import StatsBar from '@/components/dashboard/stats-bar'
import ContractTable from '@/components/dashboard/contract-table'
import EmptyDashboard from '@/components/dashboard/empty-dashboard'
import type { DashboardContract, GetDashboardResponse } from '@/types'

async function getDashboardData(userId: string): Promise<GetDashboardResponse> {
  const supabase = createServerSupabaseClient()

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, name, contract_type, status, page_count, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const { data: termCounts } = await supabase
    .from('key_terms')
    .select('contract_id')
    .eq('user_id', userId)

  const countMap: Record<string, number> = {}
  termCounts?.forEach((r) => {
    countMap[r.contract_id] = (countMap[r.contract_id] ?? 0) + 1
  })

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

  return { contracts: rows, stats }
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { contracts, stats } = await getDashboardData(user!.id)

  return (
    <PageContainer maxWidth="xl">
      <DashboardHeader />
      {contracts.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <>
          <StatsBar stats={stats} />
          <div className="mt-6">
            <ContractTable contracts={contracts} />
          </div>
        </>
      )}
    </PageContainer>
  )
}
