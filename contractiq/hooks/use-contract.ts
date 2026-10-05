import useSWR from 'swr'
import type { GetContractResponse, KeyTerm } from '@/types'

export function useContract(contractId: string) {
  const { data, error, isLoading, mutate } = useSWR<GetContractResponse>(
    contractId ? `/api/contracts/${contractId}` : null,
    { revalidateOnFocus: false }
  )

  return {
    contract: data?.contract,
    keyTerms: data?.key_terms ?? [] as KeyTerm[],
    chatSessionId: data?.chat_session_id,
    isLoading,
    error,
    mutate,
  }
}
