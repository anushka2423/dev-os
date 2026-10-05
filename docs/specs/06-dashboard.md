# Spec 06 — Dashboard

**User Stories:** US-008
**Priority:** P1
**Functional Requirements:** FR-10

---

## Overview

The dashboard is the user's home after sign-in. It shows a list of all their contracts with metadata, status, and quick-access links. Contracts are sortable by date and filterable by type. The empty state guides new users to upload their first contract.

---

## User Flow

```
/dashboard
  1. Server component fetches all contracts for the authenticated user
  2. If 0 contracts: show empty state with "Upload your first contract" CTA
  3. If contracts exist: show stats bar + sortable contract table
  4. User clicks a contract row → navigate to /contracts/[id]
  5. User clicks column header → toggle sort order
  6. User clicks "+ New Contract" → navigate to /upload
```

---

## API Route

### `GET /api/dashboard`

**File:** `app/api/dashboard/route.ts`

**Auth:** Required.

**Processing:**
1. Validate JWT → get `userId`
2. Fetch all contracts:
   ```sql
   SELECT id, name, contract_type, status, page_count, created_at
   FROM contracts
   WHERE user_id = $1
   ORDER BY created_at DESC
   ```
3. Fetch term counts per contract:
   ```sql
   SELECT contract_id, COUNT(*) as term_count
   FROM key_terms
   WHERE user_id = $1
   GROUP BY contract_id
   ```
4. Join term counts onto contract rows

**Response 200:**
```json
{
  "contracts": [
    {
      "id": "uuid",
      "name": "Acme_NDA_2026.pdf",
      "contract_type": "NDA",
      "status": "processed",
      "page_count": 12,
      "term_count": 10,
      "created_at": "2026-10-05T09:00:00Z"
    }
  ],
  "stats": {
    "total": 5,
    "processed": 4,
    "processing": 0,
    "error": 1
  }
}
```

**Alternative:** This data can also be fetched server-side in the page component using `createServerSupabaseClient()` directly (no dedicated API route needed). Choose the approach that matches the project's data-fetching pattern established in Spec 04 (server component fetch).

---

## Page Layout

**File:** `app/(app)/dashboard/page.tsx`

```
<DashboardHeader />           ← "My Contracts" + "+ New Contract" button
<StatsBar />                  ← total contracts + breakdown by status
<ContractTable />             ← sortable table of contracts
  or
<EmptyDashboard />            ← shown when no contracts exist
```

---

## Component Specs

### `DashboardHeader`

**File:** `components/dashboard/dashboard-header.tsx`

**Props:** none

**Renders:**
- Heading: "My Contracts" (h1, `ink-900`)
- "+ New Contract" button (primary, `blue-600`) → navigates to `/upload`
- Positioned right-aligned on desktop, full-width below heading on mobile

---

### `StatsBar`

**File:** `components/dashboard/stats-bar.tsx`

**Props:** `stats: { total: number; processed: number; processing: number; error: number }`

**Renders:**
- Four stat chips in a row:
  - "Total: N" — `ink-600`
  - "Processed: N" — `green-700`
  - "Processing: N" — `orange-700` (only shown if > 0)
  - "Errors: N" — `red-700` (only shown if > 0)
- Background: `bg-surface`, subtle border, `rounded-lg`, `px-4 py-2`
- Hidden on mobile if all values are 0 (no contracts)

---

### `ContractTable`

**File:** `components/dashboard/contract-table.tsx`

**Props:** `contracts: DashboardContract[]`

**Columns:**

| Column | Sortable | Width | Notes |
|--------|---------|-------|-------|
| Name | No | 40% | Truncated with ellipsis; full name in title attribute |
| Type | No | 10% | Badge: NDA (blue-50/blue-700) or MSA (purple-50/purple-700) |
| Status | No | 15% | `StatusBadge` component |
| Pages | Yes | 10% | Numeric |
| Terms | No | 10% | Numeric; shows "—" if status ≠ processed |
| Reviewed | Yes | 15% | Relative time: "2 days ago" (use `date-fns/formatDistanceToNow`) |

**Default sort:** `created_at DESC` (most recent first).

**Click on row:** Navigate to `/contracts/[id]` for processed contracts. For error/processing contracts, navigate to the same route (show status banner there).

**Sort behaviour:**
- Click "Pages" header → sort ASC; click again → sort DESC; click again → revert to date DESC
- Click "Reviewed" header → same toggle pattern
- Active sort column shows an arrow indicator

**Responsive (mobile < 768px):**
- Show only: Name, Type, Status, Reviewed
- Hide Pages and Terms columns
- Row click still navigates

---

### `ContractRow`

**File:** `components/dashboard/contract-row.tsx`

**Props:** `contract: DashboardContract`

**Renders:**
- Clickable table row (`cursor-pointer`, hover: `bg-page` = `#FAFAFA`)
- Name truncated with CSS `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- Type badge
- `StatusBadge` component
- Pages count
- Term count (or "—")
- `formatDistanceToNow(new Date(contract.created_at), { addSuffix: true })`

---

### `StatusBadge`

**File:** `components/dashboard/status-badge.tsx`

**Props:** `status: 'uploaded' | 'processing' | 'processed' | 'error'`

**Design:**

| Status | Background | Text | Icon |
|--------|-----------|------|------|
| uploaded | `blue-50` | `blue-700` | Upload icon |
| processing | `orange-50` | `orange-700` | Spinner (animated) |
| processed | `green-50` | `green-700` | Checkmark |
| error | `red-50` | `red-700` | Warning icon |

Label text: "Uploaded" / "Processing…" / "Processed" / "Error"

---

### `EmptyDashboard`

**File:** `components/dashboard/empty-dashboard.tsx`

**Props:** none

**Renders:**
- Centered illustration (use SVG placeholder — a document icon)
- Heading: "No contracts yet"
- Body: "Upload your first NDA or MSA to get started. Analysis takes less than a minute."
- Primary CTA: "Upload your first contract" → `/upload`
- Design: white card, `max-w-md`, centered on page with `mt-24`

---

## Client-Side Sorting

Sorting is client-side (no API re-fetch). The `ContractTable` component holds:
```typescript
const [sortKey, setSortKey] = useState<'page_count' | 'created_at'>('created_at')
const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

const sorted = useMemo(() =>
  [...contracts].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
  }),
  [contracts, sortKey, sortDir]
)
```

---

## Auto-Refresh for Processing Contracts

If any contract has `status = 'processing'`, poll `GET /api/dashboard` every 5 seconds until no processing contracts remain. Use SWR with `refreshInterval`:

```typescript
const { data } = useSWR('/api/dashboard', fetcher, {
  refreshInterval: hasProcessing ? 5000 : 0,
})
```

Stop polling as soon as all contracts are in a terminal state (`processed` or `error`).

---

## Edge Cases

| Scenario | Handling |
|----------|---------|
| 0 contracts | Show `EmptyDashboard` component |
| Contract in `error` state | Row is shown with red `StatusBadge`; clicking navigates to results page which shows error banner |
| Contract in `processing` state | Row shows animated spinner badge; auto-refresh active |
| Contract name > 60 chars | Truncated in table cell; full name shown in browser tooltip |
| 100+ contracts | Table renders all rows (virtual scrolling deferred to v1.1); no pagination at MVP |
| User logs out from another tab | SWR fetch returns 401 → `onError` handler redirects to `/signin` |

---

## Acceptance Criteria

- [ ] Dashboard loads all contracts for the authenticated user
- [ ] Empty state is shown when the user has no contracts
- [ ] Status badges show correct color for each state
- [ ] Clicking a contract row navigates to `/contracts/[id]`
- [ ] Sorting by Pages and Reviewed columns works (ASC/DESC toggle)
- [ ] Processing contracts auto-refresh every 5 seconds until resolved
- [ ] "+ New Contract" button navigates to `/upload`
- [ ] Dashboard loads within 2 seconds for a user with 20 contracts
- [ ] Stats bar shows correct counts

---

## Tests

**Unit:**
- `StatusBadge`: renders green for "processed", red for "error", orange for "processing"
- `ContractTable`: sorts by `page_count` ASC and DESC correctly
- `StatsBar`: does not render "Errors" chip when error count is 0
- `EmptyDashboard`: renders CTA button with correct href

**Integration:**
- `GET /api/dashboard`: returns all contracts for authenticated user; returns 401 for no JWT
- Contract term counts are joined correctly

**E2E:**
- Sign in → dashboard shows all uploaded contracts
- Click a processed contract → results page loads
- Upload a new contract → dashboard updates to include it
- Sort by "Pages" column → order changes
