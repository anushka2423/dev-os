# Spec 03 — Key Term Extraction

**User Stories:** US-003, US-004, US-005
**Priority:** P0
**Functional Requirements:** FR-03, FR-04, FR-05, FR-11

---

## Overview

After uploading a PDF, the user can optionally add up to 5 custom key terms, then clicks "Process Contract" to trigger OpenAI extraction. The backend reads `contracts.contract_text` (never the PDF file again), builds a few-shot prompt, calls GPT-4o in JSON mode, parses and validates the response, and stores all terms in `key_terms`. Custom terms added pre-processing are stored in `custom_key_terms` first, then picked up by the process route.

---

## User Flow

```
Pre-processing preview screen (post-upload)
  1. User sees standard terms list for NDA or MSA
  2. User optionally adds custom terms (up to 5):
     - Types term name in input field
     - Clicks "+ Add Term" (or presses Enter)
     - Term appears in preview list with "Custom" badge
     - At 5 terms: input is disabled with "Maximum 5 custom terms reached"
  3. User clicks "Process Contract"
  4. UI shows processing progress: steps 2 and 3
  5. POST /api/contracts/[id]/process
  6. Response: { key_terms, status: "processed" }
  7. Router pushes to /contracts/[id]
```

---

## API Routes

### `POST /api/contracts/[id]/process`

**File:** `app/api/contracts/[id]/process/route.ts`

**Auth:** Required. User must own the contract (`user_id = auth.uid()`).

**Request body:** `application/json`
```json
{
  "custom_term_ids": ["uuid", "uuid"]
}
```
`custom_term_ids` is optional. If omitted, only standard terms are extracted.

**Processing steps (in order):**

1. Validate JWT → get `userId`
2. Fetch contract from DB: `SELECT id, user_id, contract_type, contract_text, status FROM contracts WHERE id = $1`
3. Verify ownership: `contract.user_id !== userId` → 403
4. Verify status: `contract.status !== 'uploaded'` → 400 (already processed or in error state)
5. Update status: `UPDATE contracts SET status = 'processing'`
6. Fetch custom terms: `SELECT term_name FROM custom_key_terms WHERE contract_id = $1 ORDER BY created_at ASC`
7. Call `extractKeyTerms(contractText, contractType, customTermNames)` from `lib/openai/extract.ts`
8. On success: `INSERT INTO key_terms` (all terms, including custom ones marked with `is_custom = true`)
9. Update status: `UPDATE contracts SET status = 'processed'`
10. Return 200 with key_terms array

**Response 200:**
```json
{
  "contract_id": "uuid",
  "status": "processed",
  "key_terms": [
    {
      "id": "uuid",
      "term_name": "Governing Law",
      "value": "State of Delaware",
      "page_number": 8,
      "confidence_score": 94.50,
      "source_sentence": "This Agreement shall be governed by the laws of the State of Delaware.",
      "is_custom": false,
      "is_edited": false
    }
  ]
}
```

**Error responses:**

| HTTP | Code | Message |
|------|------|---------|
| 400 | `ALREADY_PROCESSED` | "This contract has already been processed." |
| 401 | `UNAUTHORIZED` | "Unauthorized" |
| 403 | `FORBIDDEN` | "You do not have access to this contract." |
| 404 | `NOT_FOUND` | "Contract not found." |
| 422 | `CONTRACT_TOO_LONG` | "Contract exceeds 15,000 tokens. Please upload a shorter document." |
| 502 | `AI_PARSE_FAILED` | "AI extraction failed after retry. Please try again." |
| 503 | `AI_UNAVAILABLE` | "AI service is temporarily unavailable. Your document is saved — please retry in a few minutes." |

On 502 or 503: `UPDATE contracts SET status = 'error'` so the user can retry without re-uploading.

---

## Custom Key Terms API

Custom terms are added to `custom_key_terms` before the process call. This is handled directly from the frontend via the Supabase client (no API route needed — RLS handles isolation).

**Frontend call (in `CustomTermInput`):**
```typescript
const supabase = createClient()
await supabase.from('custom_key_terms').insert({
  contract_id: contractId,
  term_name: termName.trim(),
})
```

**Validation before insert:**
- `termName.trim().length === 0` → reject with "Term name cannot be empty"
- Count existing custom terms for this contract: if ≥ 5 → reject with "Maximum 5 custom terms reached"
- `termName.length > 100` → reject with "Term name must be under 100 characters"

**Delete a custom term:**
```typescript
await supabase.from('custom_key_terms').delete().eq('id', termId)
```

---

## AI Extraction Module: `lib/openai/extract.ts`

```typescript
interface KeyTermResult {
  term_name: string
  value: string           // "Not found" if absent in document
  page_number: number     // 1-indexed
  confidence_score: number // 0–100
  source_sentence: string  // verbatim sentence; "" if not found
}

export async function extractKeyTerms(
  contractText: string,
  contractType: 'NDA' | 'MSA',
  customTermNames: string[]
): Promise<KeyTermResult[]>
```

**Implementation:**

1. Get standard terms for `contractType` from `lib/openai/prompts.ts`
2. Build the extraction prompt (see Prompt Spec below)
3. Call OpenAI:
   ```typescript
   const response = await openai.chat.completions.create({
     model: process.env.OPENAI_MODEL ?? 'gpt-4o',
     temperature: 0.1,
     max_tokens: 2000,
     response_format: { type: 'json_object' },
     messages: [
       { role: 'system', content: systemPrompt },
       { role: 'user', content: userMessage },
     ],
   })
   ```
4. Parse JSON: `JSON.parse(response.choices[0].message.content!)`
5. If `JSON.parse` throws → **retry once** with correction prompt (see below)
6. Validate with Zod schema (see below)
7. Return valid terms array

**Retry prompt:**
```
Your previous response was not valid JSON. Return ONLY the JSON object with a "terms" array. No explanation, no markdown, no extra text.
```
If the retry also fails → throw `ExtractionError` → caller updates `contracts.status = 'error'` and returns 502.

**OpenAI retry on rate limit / 5xx:**
Implement exponential backoff: 3 attempts, delays 1000ms → 2000ms → 4000ms.
Use a helper:
```typescript
async function callWithRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T>
```
If all attempts fail → throw `OpenAIUnavailableError` → caller returns 503.

**Zod validation schema:**
```typescript
const KeyTermSchema = z.object({
  term_name: z.string().min(1),
  value: z.string().default(''),
  page_number: z.number().int().min(1),
  confidence_score: z.number().min(0).max(100),
  source_sentence: z.string().default(''),
})

const ExtractionResponseSchema = z.object({
  terms: z.array(KeyTermSchema),
})
```
Terms that fail schema validation are dropped (not inserted). Log a warning with the invalid term data.

---

## Prompt Templates: `lib/openai/prompts.ts`

### Extraction System Prompt (v1.0)

```
You are a legal document analyser specialising in NDA and MSA contracts.
Your task is to extract specific key terms from the provided contract text.

RULES:
- Return ONLY a JSON object with a single "terms" array. No explanation. No markdown.
- Each term in the array must have exactly these fields:
  - term_name: string (the term name as given)
  - value: string (the extracted value, or "Not found" if absent)
  - page_number: number (1-indexed page where the term appears; 0 if not found)
  - confidence_score: number (0 to 100; your certainty that the extraction is correct)
  - source_sentence: string (the verbatim sentence you extracted the value from; "" if not found)
- If a term is not present in the document, return it with value "Not found", confidence_score 0, source_sentence "".
- confidence_score should reflect genuine uncertainty: 90+ means you found an exact match; 50–89 means the clause exists but may be interpreted; below 50 means uncertain or inferred.

FEW-SHOT EXAMPLES (NDA):
---
CONTRACT EXCERPT (NDA):
[PAGE 1]
This Non-Disclosure Agreement is entered into as of March 1, 2026 between Acme Corp ("Disclosing Party") and Beta Ltd ("Receiving Party").
[PAGE 3]
4. TERM. This Agreement shall remain in effect for a period of two (2) years from the Effective Date.
[PAGE 5]
8. GOVERNING LAW. This Agreement shall be governed by the laws of the State of California, without regard to conflict of law provisions.

TERMS TO EXTRACT: Parties, Term & Duration, Governing Law

EXPECTED OUTPUT:
{
  "terms": [
    {
      "term_name": "Parties",
      "value": "Acme Corp (Disclosing Party) and Beta Ltd (Receiving Party)",
      "page_number": 1,
      "confidence_score": 98,
      "source_sentence": "This Non-Disclosure Agreement is entered into as of March 1, 2026 between Acme Corp (\"Disclosing Party\") and Beta Ltd (\"Receiving Party\")."
    },
    {
      "term_name": "Term & Duration",
      "value": "2 years from the Effective Date",
      "page_number": 3,
      "confidence_score": 95,
      "source_sentence": "This Agreement shall remain in effect for a period of two (2) years from the Effective Date."
    },
    {
      "term_name": "Governing Law",
      "value": "State of California",
      "page_number": 5,
      "confidence_score": 97,
      "source_sentence": "This Agreement shall be governed by the laws of the State of California, without regard to conflict of law provisions."
    }
  ]
}
---

FEW-SHOT EXAMPLES (MSA):
---
CONTRACT EXCERPT (MSA):
[PAGE 1]
This Master Service Agreement is entered into between TechCorp Inc ("Service Provider") and RetailCo Ltd ("Client") as of June 15, 2026.
[PAGE 4]
7. LIABILITY CAP. Each party's total liability under this Agreement shall not exceed the fees paid in the twelve (12) months prior to the claim.
[PAGE 6]
10. TERMINATION. Either party may terminate this Agreement upon 30 days' written notice.

TERMS TO EXTRACT: Parties, Liability Cap, Termination Clause

EXPECTED OUTPUT:
{
  "terms": [
    {
      "term_name": "Parties",
      "value": "TechCorp Inc (Service Provider) and RetailCo Ltd (Client)",
      "page_number": 1,
      "confidence_score": 98,
      "source_sentence": "This Master Service Agreement is entered into between TechCorp Inc (\"Service Provider\") and RetailCo Ltd (\"Client\") as of June 15, 2026."
    },
    {
      "term_name": "Liability Cap",
      "value": "Total fees paid in the prior 12 months",
      "page_number": 4,
      "confidence_score": 92,
      "source_sentence": "Each party's total liability under this Agreement shall not exceed the fees paid in the twelve (12) months prior to the claim."
    },
    {
      "term_name": "Termination Clause",
      "value": "30 days' written notice by either party",
      "page_number": 6,
      "confidence_score": 96,
      "source_sentence": "Either party may terminate this Agreement upon 30 days' written notice."
    }
  ]
}
---
```

### Extraction User Message

```
Contract type: {NDA|MSA}
Terms to extract: {term1}, {term2}, ..., {customTerm1}, {customTerm2}

Contract text:
{contract_text}
```

### Standard Terms by Contract Type

**NDA:**
```
Parties, Effective Date, Confidentiality Obligations, Permitted Disclosures,
Term & Duration, Governing Law, Jurisdiction, IP Ownership, Non-Solicitation, Breach & Remedy
```

**MSA:**
```
Parties, Service Scope, Payment Terms, Invoice Schedule, Late Payment Penalty,
Liability Cap, Indemnification, IP Ownership, Termination Clause, Governing Law,
Dispute Resolution, Notice Period
```

Custom terms are appended after the standard terms in the user message.

---

## DB Write: `key_terms`

After successful extraction, insert all terms in a single batch:

```typescript
const rows = keyTerms.map((term) => ({
  contract_id: contractId,
  user_id: userId,
  term_name: term.term_name,
  value: term.value,
  page_number: term.page_number,
  confidence_score: term.confidence_score,
  source_sentence: term.source_sentence,
  is_custom: customTermNames.includes(term.term_name),
  is_edited: false,
}))

await adminClient.from('key_terms').insert(rows)
```

Use the admin client for this server-side write (bypasses RLS).

---

## Standard Term Definitions (for UI tooltips)

Each term has a plain-English tooltip shown in the key terms panel:

| Term | Plain-English Description |
|------|--------------------------|
| Parties | Who signed this agreement |
| Effective Date | When this agreement starts |
| Confidentiality Obligations | What information must be kept secret |
| Permitted Disclosures | Who is allowed to see the confidential information |
| Term & Duration | How long the agreement lasts |
| Governing Law | Which state or country's laws apply |
| Jurisdiction | Which courts would hear disputes |
| IP Ownership | Who owns intellectual property created during the relationship |
| Non-Solicitation | Restrictions on hiring each other's employees |
| Breach & Remedy | What happens if someone breaks the agreement |
| Service Scope | What services are being provided |
| Payment Terms | How and when payment is made |
| Invoice Schedule | How often invoices are sent |
| Late Payment Penalty | Fees or interest for late payment |
| Liability Cap | Maximum amount either party can owe in a lawsuit |
| Indemnification | Who covers legal costs if something goes wrong |
| Termination Clause | How and when either party can end the agreement |
| Dispute Resolution | How disagreements are resolved (arbitration, mediation, courts) |
| Notice Period | How much notice is required before termination |

---

## Edge Cases

| Scenario | Handling |
|----------|---------|
| User clicks "Process Contract" twice | Second call finds `status = 'processing'` → 400 `ALREADY_PROCESSED` |
| OpenAI returns empty `terms` array | Insert zero rows; `status = 'processed'`; results page shows empty state with "No terms were found — try adding custom terms" |
| Custom term name duplicates a standard term | Treated as any other term; both appear in results (one may have is_custom=true, the other false) |
| User adds a term name with special characters | Store as-is; OpenAI handles arbitrary term names |
| A term value is "Not found" with confidence 0 | Still inserted and displayed with ⚠️ red badge. Never hidden. |
| OpenAI returns a term with confidence > 100 | Zod clamps to 100 via `.max(100)` |
| OpenAI returns `page_number: 0` (term not found) | Stored as 0; page link in UI is hidden when `page_number === 0` |
| Contract has been deleted by user mid-processing | Foreign key cascade handles cleanup; process route gets 404 on contract fetch |
| More than 5 custom terms in DB (edge race condition) | Process route reads all custom terms but user message only appends them; no hard truncation at API layer (enforced at insert time) |

---

## Acceptance Criteria

- [ ] All standard NDA terms (10) and MSA terms (12) appear in the extraction results
- [ ] Custom terms (up to 5) appear in results with `is_custom: true` and "Custom" badge
- [ ] Every extracted term has: `term_name`, `value`, `page_number`, `confidence_score`, `source_sentence`
- [ ] Terms with `confidence_score < 50` display ⚠️ warning and tooltip — never hidden
- [ ] Confidence scores are colour-coded: green (≥ 80), amber (50–79), red (< 50)
- [ ] Terms with `value = "Not found"` are displayed (not hidden) with a red badge
- [ ] "Not found" terms show confidence 0 and are flagged
- [ ] Processing completes within 30 seconds P95 for a 20-page contract
- [ ] If OpenAI fails after retry: contract status is set to "error" and user can retry without re-uploading
- [ ] OpenAI API key is never present in any client-side response or bundle

---

## Tests

**Unit (`lib/openai/extract.ts`):**
- Builds correct prompt for NDA with all 10 standard terms
- Builds correct prompt for MSA with all 12 standard terms
- Custom terms are appended after standard terms
- Invalid JSON response → retry prompt sent → on second parse error → throws `ExtractionError`
- Valid JSON response → parsed and returned as `KeyTermResult[]`
- Term with `confidence_score: 150` → Zod clamps to 100

**Integration (`POST /api/contracts/[id]/process`):**
- Valid contract with mocked OpenAI → 200, `key_terms` array, `contracts.status = 'processed'`
- Wrong user JWT → 403
- `status = 'processing'` already → 400
- OpenAI timeout (mocked, all 3 retries) → 503, `contracts.status = 'error'`
- OpenAI returns invalid JSON twice (mocked) → 502, `contracts.status = 'error'`

**E2E (Playwright):**
- Upload NDA → add 2 custom terms → process → results page shows all 10 standard + 2 custom terms
- Custom terms show "Custom" badge in results
- A term with confidence < 50 shows ⚠️ badge
- Retry button visible when contract status = "error"
