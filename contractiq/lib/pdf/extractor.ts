export class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PdfExtractionError'
  }
}

interface ExtractionResult {
  text: string
  pageCount: number
  wordCount: number
}

export async function extractPdfText(buffer: Buffer): Promise<ExtractionResult> {
  // Dynamic import to avoid ESM/CJS issues with Next.js
  const pdfParse = (await import('pdf-parse')).default

  let pageTexts: string[] = []
  let pageNum = 0

  try {
    await pdfParse(buffer, {
      pagerender: async (pageData: { getTextContent: () => Promise<{ items: Array<{ str: string }> }> }) => {
        pageNum++
        const content = await pageData.getTextContent()
        const text = content.items.map((item) => item.str).join(' ')
        pageTexts.push(`\n[PAGE ${pageNum}]\n${text}`)
        return text
      },
    })
  } catch {
    // Fallback: use default pdf-parse without page rendering
    try {
      const result = await pdfParse(buffer)
      const text = result.text
      const wordCount = text.split(/\s+/).filter(Boolean).length
      return { text, pageCount: result.numpages, wordCount }
    } catch {
      throw new PdfExtractionError(
        'Could not read this PDF. The file may be corrupted or password-protected.'
      )
    }
  }

  const text = pageTexts.join('\n')
  const wordCount = text.split(/\s+/).filter(Boolean).length

  return { text, pageCount: pageNum, wordCount }
}
