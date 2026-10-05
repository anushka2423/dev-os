# Spec 02 — PDF Upload & Text Extraction

**User Stories:** US-002
**Priority:** P0
**Functional Requirements:** FR-02, FR-03

---

## Overview

The upload flow is split into two sequential API calls:

1. **`POST /api/contracts/upload`** — receives the PDF, extracts text via `pdf-parse`, writes the contract record to the database, and asynchronously uploads the original PDF to Supabase Storage.
2. **`POST /api/contracts/[id]/process`** — triggered by the user clicking "Process Contract" after optionally adding custom terms (covered in Spec 03).

Text extraction happens **once at upload time**. The extracted text (with `[PAGE N]` markers) is stored in `contracts.contract_text`. All downstream steps — OpenAI extraction, chat — read from the database, not the PDF file. Supabase Storage is used only to serve the PDF for the inline PDF viewer and is explicitly non-blocking.

---

## User Flow

```
/upload page
  1. User selects contract type: NDA or MSA
  2. User drags and drops (or picks) a PDF file
  3. Client validates: MIME type = application/pdf, size ≤ 10 MB
  4. User clicks "Upload"
  5. POST /api/contracts/upload (multipart/form-data)
  6. Server validates: pages ≤ 20, extracted text ≥ 100 words
  7. Server writes contract row with status = "uploaded"
  8. Server fires async Supabase Storage upload (non-blocking)
  9. Response: { contract_id, page_count, token_count, standard_terms }
 10. UI transitions to pre-processing preview screen
     → shows list of standard terms for the selected contract type
     → shows custom term input (see Spec 03)
```

---

## API Route

### `POST /api/contracts/upload`

**File:** `app/api/contracts/upload/route.ts`

**Auth:** Required (JWT via `withAuth`)

**Content-Type:** `multipart/form-data`

**Request fields:**

| Field | Type | Required | Constraint |
|-------|------|----------|-----------|
| `file` | File | Yes | MIME type `application/pdf`, ≤ 10 MB |
| `contract_type` | String | Yes | `"NDA"` or `"MSA"` |
| `name` | String | No | Defaults to `file.name` (filename without extension) |

**Processing steps (in order):**

1. Parse multipart body → extract `file` buffer, `contract_type`, `name`
2. Validate MIME type: `file.type !== 'application/pdf'` → 400
3. Validate file size: `file.size > 10 * 1024 * 1024` → 400
4. Call `extractPdfText(buffer)` from `lib/pdf/extractor.ts`
   - Returns `{ text, pageCount, wordCount }`
5. Validate page count: `pageCount > 20` → 400
6. Validate word count: `wordCount < 100` → 422 (scanned PDF detected)
7. Estimate token count: `Math.ceil(text.length / 4)` (rough approximation)
8. Validate token count: `tokenCount > 15000` → 422
9. Generate `contractId = crypto.randomUUID()`
10. `INSERT INTO contracts` (status = 'uploaded', contract_text = extracted text)
11. Fire non-blocking Supabase Storage upload (do not `await`):
    ```
    contracts/{user_id}/{contractId}/{sanitized_filename}.pdf
    ```
    On success: `UPDATE contracts SET file_path = storagePath`
    On failure: log error, leave `file_path = null` (AI pipeline unaffected)
12. Return 201 response

**Response 201:**
```json
{
  "contract_id": "uuid",
  "status": "uploaded",
  "page_count": 12,
  "token_count": 8400,
  "standard_terms": [
    "Parties", "Effective Date", "Confidentiality Obligations",
    "Permitted Disclosures", "Term & Duration", "Governing Law",
    "Jurisdiction", "IP Ownership", "Non-Solicitation", "Breach & Remedy"
  ]
}
```

`standard_terms` is selected based on `contract_type`:
- NDA: `["Parties", "Effective Date", "Confidentiality Obligations", "Permitted Disclosures", "Term & Duration", "Governing Law", "Jurisdiction", "IP Ownership", "Non-Solicitation", "Breach & Remedy"]`
- MSA: `["Parties", "Service Scope", "Payment Terms", "Invoice Schedule", "Late Payment Penalty", "Liability Cap", "Indemnification", "IP Ownership", "Termination Clause", "Governing Law", "Dispute Resolution", "Notice Period"]`

**Error responses:**

| HTTP | Error code | Message |
|------|-----------|---------|
| 400 | `MISSING_FILE` | "No file was uploaded. Please select a PDF." |
| 400 | `INVALID_FILE_TYPE` | "Only PDF files are accepted." |
| 400 | `FILE_TOO_LARGE` | "File exceeds the 10 MB limit. Please upload a smaller contract." |
| 400 | `TOO_MANY_PAGES` | "Contract exceeds the 20-page limit for MVP. Longer contract support is coming soon." |
| 401 | `UNAUTHORIZED` | "Unauthorized" |
| 422 | `SCANNED_PDF` | "Scanned PDFs are not supported yet. Please upload a text-layer PDF." |
| 422 | `CONTRACT_TOO_LONG` | "Contract exceeds the 15,000-token limit. Please upload a shorter contract." |
| 500 | `DB_ERROR` | "Database error — your contract was not saved. Please try again." |

---

## Service Module: `lib/pdf/extractor.ts`

```typescript
interface ExtractionResult {
  text: string        // full contract text with [PAGE N] markers
  pageCount: number   // number of pages detected
  wordCount: number   // used to detect scanned PDFs (< 100 = scanned)
}

export async function extractPdfText(buffer: Buffer): Promise<ExtractionResult>
```

**Implementation requirements:**

1. Import `pdf-parse` (CommonJS — use `require()` or dynamic import inside the function to avoid ESM issues with Next.js)
2. Call `pdfParse(buffer)` — this returns `{ numpages, text }`
3. The raw `text` from `pdf-parse` does **not** contain page markers. Inject them:
   - `pdf-parse` provides a `pagerender` option that lets you hook into each page
   - Use the `pagerender` callback to prepend `\n[PAGE {pageNum}]\n` before each page's text
   - Page numbers are 1-indexed
4. Count words in the final text: `text.split(/\s+/).filter(Boolean).length`
5. Return `{ text, pageCount: numpages, wordCount }`

**Example output (excerpt):**
```
[PAGE 1]
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of January 15, 2026...

[PAGE 2]
2. CONFIDENTIALITY OBLIGATIONS

The Receiving Party agrees to hold all Confidential Information in strict confidence...
```

**Error handling in extractor:**
- If `pdf-parse` throws (corrupted PDF, password-protected PDF): re-throw as `PdfExtractionError` with message "Could not read this PDF. The file may be corrupted or password-protected."
- Caller catches `PdfExtractionError` and returns 400

---

## Supabase Storage Upload (non-blocking)

**Bucket:** `contracts` (private)
**Path:** `contracts/{user_id}/{contract_id}/{sanitized_filename}.pdf`

**Filename sanitization:** replace spaces and special characters with hyphens; lowercase; keep `.pdf` extension.

```typescript
// Fires after INSERT and does NOT block the response
;(async () => {
  try {
    const admin = createAdminSupabaseClient()
    const storagePath = `contracts/${userId}/${contractId}/${sanitizedFilename}.pdf`
    const { error } = await admin.storage
      .from('contracts')
      .upload(storagePath, buffer, { contentType: 'application/pdf' })
    if (!error) {
      await admin.from('contracts')
        .update({ file_path: storagePath })
        .eq('id', contractId)
    }
  } catch (err) {
    console.error('[storage-upload] non-blocking upload failed:', err)
    // file_path stays null; AI pipeline is unaffected
  }
})()
```

---

## Frontend — Upload Page

**File:** `app/(app)/upload/page.tsx`

**State machine:**
```
idle → uploading → preview → processing → done (redirect to /contracts/[id])
                            ↘ error (retry available)
```

### Component: `FileDropzone`

**File:** `components/contracts/file-dropzone.tsx`

**Props:** `onFile: (file: File) => void`, `isLoading: boolean`

**Behaviour:**
- Accepts drag-and-drop or click-to-pick
- Filters by MIME type: `accept="application/pdf"`
- Client-side size check: if `file.size > 10 * 1024 * 1024` → show error inline before upload
- On valid file: call `onFile(file)`
- Visual states: idle (dashed border, upload icon), drag-over (blue-50 fill, blue-600 border), loading (spinner)

**Design:**
- Border: dashed, 2px, `line-200` (`#DADADB`)
- Drag-over: `blue-50` background (`#E6EFFC`), `blue-600` border
- Error: `red-500` border, error text below
- Min height: 160px

### Component: `ContractTypeSelector`

**File:** `components/contracts/contract-type-selector.tsx`

**Props:** `value: 'NDA' | 'MSA' | null`, `onChange: (type: 'NDA' | 'MSA') => void`

**Behaviour:**
- Dropdown with two options: "Non-Disclosure Agreement (NDA)" and "Master Service Agreement (MSA)"
- Required before upload is enabled
- Process button is disabled until both a file and a contract type are selected

### Component: `ProcessingProgress`

**File:** `components/contracts/processing-progress.tsx`

**Props:** `step: 1 | 2 | 3`

**Steps:**
1. "Extracting text from PDF…"
2. "Analysing with AI…" (shown during `/process` call)
3. "Compiling results…"

Each step shows a spinner icon and step label. Completed steps show a green checkmark.

### `TermPreviewCard`

**File:** `components/contracts/term-preview-card.tsx`

**Props:** `contractType: 'NDA' | 'MSA'`, `standardTerms: string[]`, `customTerms: string[]`

**Behaviour:**
- Shows the list of standard terms that will be extracted for the contract type
- Custom terms added by the user appear in the same list with a "Custom" badge (`blue-50` background)
- Read-only; user can remove custom terms via the `CustomTermInput` component

---

## Edge Cases

| Scenario | Handling |
|----------|---------|
| User uploads non-PDF file | Client drops it (accept filter) + server validates MIME and returns 400 |
| PDF is password-protected | `pdf-parse` throws → 400 "Could not read this PDF" |
| PDF is a scan (image-only) | Extracted text < 100 words → 422 "Scanned PDFs are not supported yet" |
| User uploads a file then navigates away | Contract row with `status = 'uploaded'` exists in DB; user can see it in dashboard with status "uploaded" (not processed) |
| Supabase Storage upload fails | `file_path` stays null; user sees PDF viewer fallback (text viewer) on results page — no error shown |
| Network drops mid-upload | `fetch` throws → catch in upload page → show "Upload failed. Please check your connection and try again." with retry button |
| DB insert fails | 500 response → upload page shows "Could not save your contract. Please try again." |
| User uploads same file twice | Two separate contracts are created (no deduplication in MVP) |
| File size exactly 10 MB | Accepted (limit is `> 10 MB`) |
| Contract has exactly 100 words | Accepted (limit is `< 100 words`) |

---

## Acceptance Criteria

- [ ] Accepts PDF files up to 10 MB; rejects files > 10 MB with a clear error message
- [ ] Accepts contracts up to 20 pages; rejects > 20 pages
- [ ] Detects scanned PDFs (< 100 words extracted) and shows "Scanned PDFs are not supported yet"
- [ ] Extracted text stored in `contracts.contract_text` with `[PAGE N]` markers at every page boundary
- [ ] `contracts.page_count` reflects the actual page count
- [ ] Supabase Storage upload failure does not fail the overall upload response
- [ ] Upload completes within 10 seconds for a 20-page PDF
- [ ] After upload, UI transitions to pre-processing preview showing the standard terms for the selected contract type
- [ ] Contract type is required; upload button is disabled until both a file and type are selected
- [ ] Both drag-and-drop and click-to-pick work in Chrome, Firefox, and Safari

---

## Tests

**Unit (`lib/pdf/extractor.ts`):**
- Valid PDF buffer → returns text with correct `[PAGE N]` markers
- 5-page PDF → returns `pageCount: 5`
- Text with 200 words → `wordCount: 200`
- Text with 50 words → `wordCount: 50` (triggers scanned PDF check in caller)
- Corrupted buffer → throws `PdfExtractionError`

**Integration (`POST /api/contracts/upload`):**
- Valid 5-page PDF → 201, `contract_id` returned, row in `contracts` with `status = 'uploaded'`
- File > 10 MB → 400 `FILE_TOO_LARGE`
- No JWT → 401
- Scanned PDF (< 100 words mock) → 422 `SCANNED_PDF`
- Non-PDF MIME type → 400 `INVALID_FILE_TYPE`

**E2E (Playwright):**
- Upload a real NDA PDF → progress steps visible → pre-processing preview shows standard NDA terms
- Upload a PDF > 10 MB → error message shown inline
- Drag-and-drop a PDF onto the dropzone → file accepted, upload proceeds
