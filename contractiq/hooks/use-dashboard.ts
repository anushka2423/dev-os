import useSWR from 'swr'
import type { GetDashboardResponse } from '@/types'

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<GetDashboardResponse>('/api/dashboard', {
    refreshInterval: (data) => {
      const hasProcessing = data?.contracts.some((c) => c.status === 'processing')
      return hasProcessing ? 5000 : 0
    },
  })

  return {
    contracts: data?.contracts ?? [],
    stats: data?.stats,
    isLoading,
    error,
    mutate,
  }
}
