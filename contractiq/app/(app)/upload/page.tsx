'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import FileDropzone from '@/components/contracts/file-dropzone'
import ContractTypeSelector from '@/components/contracts/contract-type-selector'
import ProcessingProgress from '@/components/contracts/processing-progress'
import CustomTermInput from '@/components/contracts/custom-term-input'
import Button from '@/components/ui/button'
import type { ContractType, UploadState } from '@/types'

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [contractType, setContractType] = useState<ContractType | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [contractId, setContractId] = useState<string | null>(null)
  const [standardTerms, setStandardTerms] = useState<string[]>([])
  const [customTerms, setCustomTerms] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [processStep, setProcessStep] = useState<1 | 2 | 3>(1)

  async function handleUpload() {
    if (!file || !contractType) return
    setUploadState('uploading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('contract_type', contractType)
      formData.append('name', file.name.replace(/\.pdf$/i, ''))

      const res = await fetch('/api/contracts/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? 'Upload failed. Please try again.')
        setUploadState('error')
        return
      }

      setContractId(data.contract_id)
      setStandardTerms(data.standard_terms)
      setUploadState('preview')
    } catch {
      setError('Upload failed. Please check your connection and try again.')
      setUploadState('error')
    }
  }

  async function handleProcess() {
    if (!contractId) return
    setUploadState('processing')
    setProcessStep(2)

    try {
      const res = await fetch(`/api/contracts/${contractId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? 'Processing failed. Please try again.')
        setUploadState('error')
        return
      }

      setProcessStep(3)
      setUploadState('done')
      router.push(`/contracts/${contractId}`)
    } catch {
      setError('Processing failed. Please try again.')
      setUploadState('error')
    }
  }

  const isUploading = uploadState === 'uploading'
  const isProcessing = uploadState === 'processing'

  if (uploadState === 'preview' || uploadState === 'processing' || uploadState === 'done') {
    return (
      <PageContainer maxWidth="md">
        <h1 className="text-2xl font-bold text-ink-900 mb-2">Review before processing</h1>
        <p className="text-ink-600 text-sm mb-6">
          These terms will be extracted from your {contractType}. Add custom terms if needed.
        </p>

        {isProcessing && (
          <div className="mb-6">
            <ProcessingProgress step={processStep} />
          </div>
        )}

        <div className="bg-bg-surface border border-line-200 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-ink-900 mb-3">
            Standard terms ({standardTerms.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {standardTerms.map((t) => (
              <span
                key={t}
                className="px-2 py-1 rounded-full bg-line-100 text-ink-600 text-xs font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <CustomTermInput
          contractId={contractId!}
          customTerms={customTerms}
          onTermsChange={setCustomTerms}
          disabled={isProcessing}
        />

        <div className="mt-6 flex gap-3">
          <Button
            variant="primary"
            onClick={handleProcess}
            isLoading={isProcessing}
            disabled={isProcessing}
          >
            Process Contract
          </Button>
          <Button
            variant="ghost"
            onClick={() => { setUploadState('idle'); setFile(null); setContractId(null) }}
            disabled={isProcessing}
          >
            Start over
          </Button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-700">{error}</p>
        )}
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="md">
      <h1 className="text-2xl font-bold text-ink-900 mb-2">Upload a contract</h1>
      <p className="text-ink-600 text-sm mb-8">
        Supports NDAs and MSAs up to 10 MB and 20 pages. Text-layer PDFs only.
      </p>

      <div className="space-y-6">
        <ContractTypeSelector value={contractType} onChange={setContractType} />
        <FileDropzone onFile={setFile} isLoading={isUploading} />

        {error && (
          <p className="text-sm text-red-700">{error}</p>
        )}

        <Button
          variant="primary"
          onClick={handleUpload}
          isLoading={isUploading}
          disabled={!file || !contractType || isUploading}
        >
          Upload
        </Button>
      </div>
    </PageContainer>
  )
}
