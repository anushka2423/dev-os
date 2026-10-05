'use client'

import { useEffect, useRef, useState } from 'react'
import Spinner from '@/components/ui/spinner'

interface PdfViewerProps {
  signedUrl: string
  targetPage: number
  onError: () => void
}

export default function PdfViewer({ signedUrl, targetPage, onError }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1.0)
  const [isLoading, setIsLoading] = useState(true)
  const [pageCount, setPageCount] = useState(0)
  const pdfRef = useRef<unknown>(null)
  const canvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map())

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker.js'
        const pdf = await pdfjs.getDocument(signedUrl).promise
        if (cancelled) return

        pdfRef.current = pdf
        setPageCount(pdf.numPages)

        // Render all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) break
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale })
          const canvas = canvasesRef.current.get(i)
          if (!canvas) continue
          const ctx = canvas.getContext('2d')!
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: ctx, viewport }).promise
        }
        setIsLoading(false)
      } catch {
        if (!cancelled) onError()
      }
    }

    load()
    return () => { cancelled = true }
  }, [signedUrl, scale])

  useEffect(() => {
    if (!containerRef.current || targetPage < 1) return
    const target = containerRef.current.querySelector(`[data-page="${targetPage}"]`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [targetPage])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-line-200 bg-bg-surface sticky top-0 z-10">
        <button onClick={() => setScale((s) => Math.max(0.5, s - 0.25))} className="text-sm text-ink-600 hover:text-ink-900 px-2 py-1 rounded hover:bg-line-100">−</button>
        <span className="text-xs text-ink-600">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale((s) => Math.min(3, s + 0.25))} className="text-sm text-ink-600 hover:text-ink-900 px-2 py-1 rounded hover:bg-line-100">+</button>
        <button onClick={() => setScale(1)} className="text-xs text-ink-400 hover:text-ink-600">Reset</button>
        {pageCount > 0 && <span className="text-xs text-ink-400 ml-auto">{pageCount} pages</span>}
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 smooth-scroll">
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <Spinner size="lg" />
          </div>
        )}
        {Array.from({ length: Math.max(pageCount, 1) }, (_, i) => i + 1).map((pageNum) => (
          <div key={pageNum} data-page={pageNum} className="border border-line-200 rounded bg-white shadow-sm overflow-hidden">
            <canvas
              ref={(el) => { if (el) canvasesRef.current.set(pageNum, el) }}
              className="block w-full"
            />
            <div className="text-center py-1 text-[10px] text-ink-400 border-t border-line-100">
              {pageNum}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
