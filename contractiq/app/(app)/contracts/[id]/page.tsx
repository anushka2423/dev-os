'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useContract } from '@/hooks/use-contract'
import ResultsHeader from '@/components/contracts/results-header'
import ResultsLayout from '@/components/contracts/results-layout'
import PdfViewer from '@/components/viewer/pdf-viewer'
import TextViewer from '@/components/viewer/text-viewer'
import KeyTermsPanel from '@/components/contracts/key-terms-panel'
import ChatTab from '@/components/chat/chat-tab'
import Skeleton from '@/components/ui/skeleton'
import ErrorBanner from '@/components/layout/error-banner'
import type { KeyTerm } from '@/types'

export default function ContractResultsPage() {
  const params = useParams<{ id: string }>()
  const { contract, keyTerms: initialTerms, chatSessionId, isLoading, error } = useContract(params.id)
  const [activePage, setActivePage] = useState(1)
  const [keyTerms, setKeyTerms] = useState<KeyTerm[]>(initialTerms)
  const [usePdfViewer, setUsePdfViewer] = useState(true)

  // Sync keyTerms when SWR loads
  if (initialTerms.length > 0 && keyTerms.length === 0) {
    setKeyTerms(initialTerms)
  }

  function handleTermUpdated(updated: Pick<KeyTerm, 'id' | 'value' | 'original_value' | 'is_edited'>) {
    setKeyTerms((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-6xl mx-auto">
        <Skeleton height={32} width={300} />
        <Skeleton height={24} width={200} />
        <div className="grid grid-cols-2 gap-6 mt-8">
          <Skeleton height={600} />
          <Skeleton height={600} />
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <ErrorBanner message="Could not load this contract. It may have been deleted or you may not have access." />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <ResultsHeader
        contractName={contract.name}
        contractType={contract.contract_type}
        createdAt={contract.created_at}
      />

      <div className="flex-1 overflow-hidden">
        <ResultsLayout
          leftPanel={
            contract.signed_url && usePdfViewer ? (
              <PdfViewer
                signedUrl={contract.signed_url}
                targetPage={activePage}
                onError={() => setUsePdfViewer(false)}
              />
            ) : (
              <TextViewer contractId={params.id} targetPage={activePage} />
            )
          }
          rightPanel={
            <KeyTermsPanel
              keyTerms={keyTerms}
              onPageClick={setActivePage}
              onTermUpdated={handleTermUpdated}
            />
          }
        />
      </div>

      {chatSessionId && (
        <ChatTab
          sessionId={chatSessionId}
          contractId={params.id}
          onPageCitation={setActivePage}
        />
      )}
    </div>
  )
}
