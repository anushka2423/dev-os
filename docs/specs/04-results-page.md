# Spec 04 — Results Page

**User Stories:** US-003, US-004, US-006, US-009
**Priority:** P0 / P1
**Functional Requirements:** FR-04, FR-06, FR-07, FR-11

---

## Overview

The results page is the core of the ContractIQ experience. It shows a two-panel layout: the left panel renders the contract (as a PDF via PDF.js or as paginated text if Storage is unavailable), and the right panel shows the extracted key terms. Clicking a term's page number navigates the left panel to that page. Users can expand source sentences, view confidence warnings, and edit terms inline.

A "Not legal advice" disclaimer is always visible at the top.

---

## User Flow

```
/contracts/[id]
  1. Server component fetches contract + key_terms + chat_session_id
  2. Two-panel layout renders:
     Left: PDF viewer (primary) or text viewer (fallback)
     Right: key terms panel (sorted by page_number ASC)
     Bottom/side: chat tab
  3. User clicks a page number link → left panel scrolls to that page
  4. User expands "Why?" accordion → source sentence shown
  5. User clicks confidence badge → tooltip explains the score
  6. User clicks term value → inline edit mode activates
  7. User edits value → saves → "Edited" badge appears
  8. User clicks "Chat" tab → chat interface loads
```

---

## API Route

### `GET /api/contracts/[id]`

**File:** `app/api/contracts/[id]/route.ts`

**Auth:** Required. User must own the contract.

**Processing:**
1. Fetch contract row: `SELECT id, user_id, name, contract_type, status, page_count, file_path, created_at FROM contracts WHERE id = $1`
2. Verify ownership → 403 if mismatch
3. Fetch key terms: `SELECT * FROM key_terms WHERE contract_id = $1 ORDER BY page_number ASC`
4. Fetch or create chat session: `SELECT id FROM chat_sessions WHERE contract_id = $1` (if none exists, create one and return the new id)
5. If `file_path` is not null: generate signed URL from Supabase Storage (1-hour expiry)

**Response 200:**
```json
{
  "contract": {
    "id": "uuid",
    "name": "Acme_NDA_2026.pdf",
    "contract_type": "NDA",
    "status": "processed",
    "page_count": 12,
    "created_at": "2026-10-05T09:00:00Z",
    "signed_url": "https://...supabase.co/storage/v1/object/sign/...?token=..."
  },
  "key_terms": [
    {
      "id": "uuid",
      "term_name": "Parties",
      "value": "Acme Corp and Beta Ltd",
      "original_value": null,
      "page_number": 1,
      "confidence_score": 98.00,
      "source_sentence": "This Agreement is entered into between Acme Corp and Beta Ltd.",
      "is_custom": false,
      "is_edited": false
    }
  ],
  "chat_session_id": "uuid"
}
```

`signed_url` is `null` if `file_path` is null (Storage upload failed) — client renders text viewer fallback.

**Error responses:** 401, 403, 404

---

## Inline Term Editing

### `PATCH /api/key-terms/[id]`

**File:** `app/api/key-terms/[id]/route.ts`

**Auth:** Required. User must own the key term.

**Request body:**
```json
{ "value": "Updated term value" }
```

**Processing:**
1. Validate JWT → get userId
2. Fetch key_term: `SELECT id, user_id, value, is_edited FROM key_terms WHERE id = $1`
3. Verify ownership: `key_term.user_id !== userId` → 403
4. Validate: `value.trim().length === 0` → 400
5. On first edit (`is_edited === false`): set `original_value = current value`
6. Update: `value = newValue`, `is_edited = true`
7. Return updated row

**Response 200:**
```json
{
  "id": "uuid",
  "value": "New user-provided value",
  "original_value": "Original AI value",
  "is_edited": true
}
```

**Error responses:** 400 (empty value), 401, 403, 404

This call must complete in ≤ 2 seconds (simple DB update with index lookup).

---

## Page Layout

**File:** `app/(app)/contracts/[id]/page.tsx`

```typescript
// Server Component — fetches initial data
// Passes data as props to client components
const { contract, keyTerms, chatSessionId } = await fetchContractData(id, userId)
```

**Layout structure:**
```
<ResultsHeader />              ← contract name, type, date, disclaimer
<ResultsLayout>
  <LeftPanel>
    {signedUrl
      ? <PdfViewer signedUrl={signedUrl} targetPage={activePage} />
      : <TextViewer contractText={contractText} targetPage={activePage} />
    }
  </LeftPanel>
  <RightPanel>
    <KeyTermsPanel
      keyTerms={keyTerms}
      onPageClick={(page) => setActivePage(page)}
    />
  </RightPanel>
</ResultsLayout>
<ChatTab sessionId={chatSessionId} contractId={id} />
```

`activePage` is `useState(1)` in the parent page component. It flows down to both the viewer and the key terms panel.

---

## Component Specs

### `ResultsHeader`

**File:** `components/contracts/results-header.tsx`

**Props:** `contractName: string`, `contractType: 'NDA' | 'MSA'`, `createdAt: string`

**Renders:**
- Contract name (h1, `ink-900`)
- Contract type badge (blue-50 fill, `blue-700` text)
- Formatted date ("Reviewed October 5, 2026")
- "Not legal advice" disclaimer: fixed yellow bar below the header
  - Text: "⚠️ This is an AI-assisted review tool, not legal advice. Always verify critical terms with a qualified lawyer."
  - Background: `orange-50` (use `#FFF7ED` or closest token), text: `orange-700`
  - Non-dismissible

---

### `ResultsLayout`

**File:** `components/contracts/results-layout.tsx`

**Props:** `children: React.ReactNode` (left panel, right panel)

**Design:**
- Desktop (≥ 1024px): two columns, 55% left / 45% right, `gap-6`
- Mobile (< 1024px): single column stack, left panel first, right panel below
- Both panels are full-viewport-height with independent scroll (`overflow-y: auto`)
- Right panel is sticky on desktop

---

### `PdfViewer`

**File:** `components/viewer/pdf-viewer.tsx`

**Props:** `signedUrl: string`, `targetPage: number`, `onError: () => void`

**Behaviour:**
- Uses `pdfjs-dist` (loaded as a dynamic import to avoid SSR issues)
- Sets `pdfjs.GlobalWorkerOptions.workerSrc` to `/pdf-worker.js` (copied from `pdfjs-dist/build/pdf.worker.js` into `public/`)
- Renders pages lazily — only renders visible pages + 1 page ahead
- When `targetPage` prop changes: scrolls the page container to the corresponding `<div data-page={n}>` element using `scrollIntoView({ behavior: 'smooth' })`
- Handles zoom: `+` button increases scale by 0.25x, `-` decreases, reset to 1.0x
- `onError`: called when the signed URL fails to load the PDF → parent switches to TextViewer

**States:**
- Loading: skeleton placeholder for first page
- Loaded: renders pages
- Error: calls `onError()` (parent renders TextViewer)

**Design:**
- White background (`bg-surface`)
- Page toolbar: zoom controls, current page / total pages indicator
- Each page has a subtle `line-100` border and `4px` bottom margin
- Page number watermark at bottom of each page: `ink-400`, small text

---

### `TextViewer`

**File:** `components/viewer/text-viewer.tsx`

**Props:** `contractText: string`, `targetPage: number`

**Purpose:** Fallback when Supabase Storage is unavailable or the PDF fails to load.

**Behaviour:**
- Parses `contractText` by splitting on `[PAGE N]` markers using regex: `/\[PAGE (\d+)\]/g`
- Renders each page as a labelled section:
  ```
  ─── Page 1 ───────────────────────────────
  [page 1 text content]

  ─── Page 2 ───────────────────────────────
  [page 2 text content]
  ```
- Each section has a `data-page={n}` attribute
- When `targetPage` changes: `scrollIntoView({ behavior: 'smooth' })` on the matching section
- Monospace font (`font-mono`), `text-sm`, preserved whitespace (`whitespace-pre-wrap`)

---

### `KeyTermsPanel`

**File:** `components/contracts/key-terms-panel.tsx`

**Props:** `keyTerms: KeyTerm[]`, `onPageClick: (page: number) => void`

**Behaviour:**
- Renders a `TermCard` for each term, ordered by `page_number ASC`
- Terms with `page_number === 0` ("Not found") appear at the bottom, after all located terms
- Header: "Key Terms" + count (e.g., "12 terms found")

---

### `TermCard`

**File:** `components/contracts/term-card.tsx`

**Props:** `term: KeyTerm`, `onPageClick: (page: number) => void`, `onTermUpdated: (updated: KeyTerm) => void`

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Term Name              [Confidence Badge]  │
│  Value (or TermEditor when editing)         │
│  Page X link  |  [Edited badge if edited]   │
│  [Why? accordion]  →  source sentence       │
│  [⚠️ Low confidence warning if < 50%]       │
└─────────────────────────────────────────────┘
```

**Page link:**
- Shows "Page {page_number}" as a clickable link
- `onClick`: calls `onPageClick(term.page_number)`
- Hidden when `page_number === 0`
- Color: `blue-700` (`#0E469E`), underline on hover

**Confidence badge → `ConfidenceBadge`**

**"Why?" accordion:**
- Collapsed by default
- Label: "Why?" in `ink-400`
- Expands to show `source_sentence` in `ink-600`, italic, with left border in `line-200`
- If `source_sentence === ""`: show "No source sentence available"

**"Edited" badge:** Visible when `is_edited === true`. Blue-50 background, blue-700 text. Non-interactive.

**"Custom" badge:** Visible when `is_custom === true`. Same design as Edited but text: "Custom".

---

### `ConfidenceBadge`

**File:** `components/contracts/confidence-badge.tsx`

**Props:** `score: number`

**Design:**

| Score | Background | Text | Icon |
|-------|-----------|------|------|
| ≥ 80 | `green-50` (`#E7F7E7`) | `green-700` (`#0D720B`) | ✓ |
| 50–79 | `orange-50` | `orange-700` | ~ |
| < 50 | `red-50` | `red-700` (`#942529`) | ⚠️ |

Shows: `{score}%` + icon
Tooltip on hover (via `Tooltip` component): 
- ≥ 80: "High confidence — AI is confident in this extraction"
- 50–79: "Medium confidence — verify this term in the document"
- < 50: "Low confidence — we recommend verifying this directly in the document"

---

### `LowConfidenceWarning`

**File:** `components/contracts/low-confidence-warning.tsx`

**Props:** `termName: string`

**Behaviour:**
- Only renders when `confidence_score < 50`
- Non-dismissible (no close button)
- Text: "⚠️ Low confidence — we recommend verifying '{termName}' directly in the document."
- Background: `red-50`, border: `red-500`
- Positioned below the term value, above the "Why?" accordion

---

### `TermEditor`

**File:** `components/contracts/term-editor.tsx`

**Props:** `term: KeyTerm`, `onSaved: (updated: Pick<KeyTerm, 'id' | 'value' | 'original_value' | 'is_edited'>) => void`

**States:** `view` → `editing` → `saving` → `view` (with edited badge)

**Behaviour:**
- `view` state: term value displayed as text. On click → transition to `editing`
- `editing` state: `<textarea>` pre-filled with current value. "Save" + "Cancel" buttons
  - "Cancel" → discard changes, return to `view`
  - "Save" → `PATCH /api/key-terms/[id]` with `{ value: newValue }`
  - Empty value: "Save" button is disabled
- `saving` state: shows spinner on "Save" button
- On successful save: call `onSaved(updatedTerm)` → parent updates `keyTerms` state → "Edited" badge appears
- On error: show toast "Failed to save — please try again"

**Optimistic update:** Do NOT update UI before the API call returns (a save failure should not leave a stale value displayed). Wait for the API response.

---

## Edge Cases

| Scenario | Handling |
|----------|---------|
| `signed_url` is null (Storage unavailable) | Text viewer renders automatically — no error message to user |
| Signed URL expires while user is on the page (after 1 hour) | PDF.js request fails → `onError` triggers → switch to text viewer with a toast: "PDF viewer refreshed — click here to reload" |
| Term `page_number = 0` (not found) | Page link hidden; term still shows with ⚠️ and value "Not found" |
| Zero key terms returned (model found nothing) | KeyTermsPanel shows: "No terms were extracted. Try adding custom terms and re-processing." |
| User edits a term and saves, then refreshes | Edited value persists (stored in DB); "Edited" badge still shown |
| User edits the same term twice | On second edit, `original_value` is already set — do NOT overwrite it again (preserve first AI extraction) |
| 50+ key terms (large MSA with many custom terms) | Panel scrolls independently; all terms render with virtual scroll if performance degrades (defer to v1.1) |
| User on mobile | Layout stacks (PDF top, terms below); chat tab accessible via bottom tab bar |

---

## Acceptance Criteria

- [ ] PDF viewer renders all pages for a valid signed URL; zoom and scroll work
- [ ] Text viewer renders correctly when `signed_url` is null; page sections are labelled
- [ ] Clicking a page number on any term card scrolls the left panel to that page with smooth animation
- [ ] Confidence badges show correct colour for each of the three tiers
- [ ] Terms with `confidence_score < 50` show ⚠️ `LowConfidenceWarning` — never hidden
- [ ] "Why?" accordion expands to show the source sentence
- [ ] Inline edit: user can edit a term value, save it, see "Edited" badge, and refresh to find the value persisted
- [ ] `original_value` is stored on first edit and does not change on subsequent edits
- [ ] "Not legal advice" disclaimer is always visible at the top of the results page
- [ ] Results page loads within 3 seconds for a 20-page contract (after processing is complete)

---

## Tests

**Unit:**
- `ConfidenceBadge`: renders green for score 85, amber for 65, red for 30
- `LowConfidenceWarning`: renders when score < 50; does not render when score ≥ 50
- `TextViewer`: correctly parses `[PAGE 1]...[PAGE 2]...` into two labelled sections
- `TermEditor`: disables Save on empty value; calls PATCH on save; shows "Edited" badge after success

**Integration:**
- `GET /api/contracts/[id]`: returns `signed_url` when `file_path` is set; returns `signed_url: null` when `file_path` is null
- `PATCH /api/key-terms/[id]`: sets `original_value` on first edit, does not overwrite on second; returns 400 for empty value; returns 403 for wrong user
- Cross-user access: GET with wrong user JWT → 403

**E2E:**
- Results page loads; key terms panel renders all terms
- Click page number → PDF viewer scrolls to correct page
- Expand "Why?" → source sentence shown
- Edit a term value → "Edited" badge appears → refresh → value persists
- `signed_url` null scenario: mount TextViewer fallback and verify page navigation works
