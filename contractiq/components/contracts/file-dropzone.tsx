'use client'

import { useState, useRef } from 'react'
import Spinner from '@/components/ui/spinner'

interface FileDropzoneProps {
  onFile: (file: File) => void
  isLoading: boolean
}

const MAX_SIZE = 10 * 1024 * 1024

export default function FileDropzone({ onFile, isLoading }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function validate(file: File): boolean {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.')
      return false
    }
    if (file.size > MAX_SIZE) {
      setError('File exceeds the 10 MB limit.')
      return false
    }
    return true
  }

  function handleFile(file: File) {
    setError(null)
    if (!validate(file)) return
    setSelectedFile(file.name)
    onFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        onClick={() => !isLoading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`min-h-[160px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors p-6 text-center
          ${isDragging ? 'border-blue-600 bg-blue-50' : 'border-line-200 bg-bg-surface hover:border-blue-600 hover:bg-blue-50/40'}
          ${error ? 'border-red-500' : ''}
          ${isLoading ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        {isLoading ? (
          <Spinner size="lg" />
        ) : selectedFile ? (
          <>
            <span className="text-2xl mb-2">📄</span>
            <p className="text-sm font-medium text-ink-900">{selectedFile}</p>
            <p className="text-xs text-ink-400 mt-1">Click to change file</p>
          </>
        ) : (
          <>
            <span className="text-3xl mb-3">☁️</span>
            <p className="text-sm font-medium text-ink-900">Drop your PDF here or click to browse</p>
            <p className="text-xs text-ink-400 mt-1">PDF only · Max 10 MB · Max 20 pages</p>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
