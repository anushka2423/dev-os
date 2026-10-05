import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { extractPdfText } from '@/lib/pdf/extractor'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { STANDARD_TERMS } from '@/lib/openai/prompts'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_PAGES = 20
const MIN_WORDS = 100
const MAX_TOKENS = parseInt(process.env.MAX_CONTRACT_TOKENS ?? '15000', 10)

export const POST = withAuth(async (req: NextRequest, user) => {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const contractType = formData.get('contract_type') as string | null
  const name = (formData.get('name') as string | null) ?? file?.name ?? 'Untitled'

  if (!file) {
    return NextResponse.json({ code: 'MISSING_FILE', message: 'No file was uploaded.' }, { status: 400 })
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ code: 'INVALID_FILE_TYPE', message: 'Only PDF files are accepted.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ code: 'FILE_TOO_LARGE', message: 'File exceeds the 10 MB limit.' }, { status: 400 })
  }
  if (!contractType || !['NDA', 'MSA'].includes(contractType)) {
    return NextResponse.json({ code: 'INVALID_CONTRACT_TYPE', message: 'Contract type must be NDA or MSA.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let extraction: { text: string; pageCount: number; wordCount: number }
  try {
    extraction = await extractPdfText(buffer)
  } catch {
    return NextResponse.json({ code: 'PDF_PARSE_ERROR', message: 'Could not read this PDF. It may be corrupted or password-protected.' }, { status: 400 })
  }

  if (extraction.pageCount > MAX_PAGES) {
    return NextResponse.json({ code: 'TOO_MANY_PAGES', message: 'Contract exceeds the 20-page limit.' }, { status: 400 })
  }
  if (extraction.wordCount < MIN_WORDS) {
    return NextResponse.json({ code: 'SCANNED_PDF', message: 'Scanned PDFs are not supported yet. Please upload a text-layer PDF.' }, { status: 422 })
  }

  const tokenEstimate = Math.ceil(extraction.text.length / 4)
  if (tokenEstimate > MAX_TOKENS) {
    return NextResponse.json({ code: 'CONTRACT_TOO_LONG', message: 'Contract exceeds the 15,000-token limit.' }, { status: 422 })
  }

  const admin = createAdminSupabaseClient()
  const contractId = crypto.randomUUID()

  const { error: dbError } = await admin.from('contracts').insert({
    id: contractId,
    user_id: user.id,
    name: name.replace(/\.pdf$/i, '').slice(0, 200),
    contract_type: contractType,
    status: 'uploaded',
    page_count: extraction.pageCount,
    contract_text: extraction.text,
  })

  if (dbError) {
    return NextResponse.json({ code: 'DB_ERROR', message: 'Database error — your contract was not saved.' }, { status: 500 })
  }

  // Non-blocking Storage upload
  ;(async () => {
    try {
      const sanitized = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-')
      const storagePath = `contracts/${user.id}/${contractId}/${sanitized}`
      const { error } = await admin.storage
        .from('contracts')
        .upload(storagePath, buffer, { contentType: 'application/pdf' })
      if (!error) {
        await admin.from('contracts').update({ file_path: storagePath }).eq('id', contractId)
      }
    } catch (err) {
      console.error('[storage-upload] non-blocking upload failed:', err)
    }
  })()

  const standardTerms = STANDARD_TERMS[contractType as 'NDA' | 'MSA']

  return NextResponse.json(
    {
      contract_id: contractId,
      status: 'uploaded',
      page_count: extraction.pageCount,
      token_count: tokenEstimate,
      standard_terms: standardTerms,
    },
    { status: 201 }
  )
})
