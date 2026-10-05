# Spec 08 — TypeScript Types & SWR Hooks

**Priority:** P0 (used throughout all features)

---

## Overview

Centralised TypeScript type definitions for all database entities and API response shapes. SWR hooks for client-side data fetching. These are the single source of truth for data shapes across the entire frontend.

---

## TypeScript Types

**File:** `types/index.ts`

```typescript
// ─── Database Entity Types ───────────────────────────────────────────────────

export type ContractType = 'NDA' | 'MSA'
export type ContractStatus = 'uploaded' | 'processing' | 'processed' | 'error'

export interface Contract {
  id: string
  user_id: string
  name: string
  contract_type: ContractType
  status: ContractStatus
  page_count: number
  file_path: string | null
  contract_text: string
  created_at: string
  updated_at: string
}

export interface KeyTerm {
  id: string
  contract_id: string
  user_id: string
  term_name: string
  value: string
  original_value: string | null
  page_number: number
  confidence_score: number
  source_sentence: string
  is_custom: boolean
  is_edited: boolean
  created_at: string
  updated_at: string
}

export interface CustomKeyTerm {
  id: string
  contract_id: string
  user_id: string
  term_name: string
  created_at: string
}

export type MessageRole = 'user' | 'assistant'

export interface ChatSession {
  id: string
  contract_id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  role: MessageRole
  content: string
  page_citations: number[]
  created_at: string
}

export type FeedbackRating = 'up' | 'down'

export interface UserFeedback {
  id: string
  contract_id: string
  user_id: string
  rating: FeedbackRating
  comment: string | null
  created_at: string
}

// ─── API Request / Response Types ────────────────────────────────────────────

// POST /api/contracts/upload → response
export interface UploadContractResponse {
  contract_id: string
  status: 'uploaded'
  page_count: number
  token_count: number
  standard_terms: string[]
}

// POST /api/contracts/[id]/process → response
export interface ProcessContractResponse {
  contract_id: string
  status: 'processed'
  key_terms: KeyTerm[]
}

// GET /api/contracts/[id] → response
export interface GetContractResponse {
  contract: Pick<Contract, 'id' | 'name' | 'contract_type' | 'status' | 'page_count' | 'created_at'> & {
    signed_url: string | null
  }
  key_terms: KeyTerm[]
  chat_session_id: string
}

// PATCH /api/key-terms/[id] → request body
export interface UpdateKeyTermRequest {
  value: string
}

// PATCH /api/key-terms/[id] → response
export interface UpdateKeyTermResponse {
  id: string
  value: string
  original_value: string | null
  is_edited: true
}

// POST /api/chat/[contractId] → request body
export interface SendChatMessageRequest {
  session_id: string
  message: string
}

// POST /api/chat/[contractId] → response
export interface SendChatMessageResponse {
  message_id: string
  role: 'assistant'
  content: string
  page_citations: number[]
  created_at: string
}

// GET /api/chat/[contractId] → response
export interface GetChatHistoryResponse {
  session_id: string
  messages: Pick<ChatMessage, 'id' | 'role' | 'content' | 'page_citations' | 'created_at'>[]
}

// GET /api/dashboard → response
export interface DashboardContract {
  id: string
  name: string
  contract_type: ContractType
  status: ContractStatus
  page_count: number
  term_count: number
  created_at: string
}

export interface GetDashboardResponse {
  contracts: DashboardContract[]
  stats: {
    total: number
    processed: number
    processing: number
    error: number
  }
}

// ─── API Error Type ───────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  code: string
  message: string
}

// ─── UI-Only Types ────────────────────────────────────────────────────────────

export type UploadState = 'idle' | 'uploading' | 'preview' | 'processing' | 'done' | 'error'

export interface UploadFormState {
  file: File | null
  contractType: ContractType | null
  customTerms: string[]
  uploadState: UploadState
  uploadError: string | null
  contractId: string | null
  standardTerms: string[]
}
```

---

## SWR Hooks

### `useContract`

**File:** `hooks/use-contract.ts`

**Purpose:** Fetches contract data + key terms + signed URL for the results page.

```typescript
import useSWR from 'swr'
import type { GetContractResponse } from '@/types'

export function useContract(contractId: string) {
  const { data, error, isLoading, mutate } = useSWR<GetContractResponse>(
    contractId ? `/api/contracts/${contractId}` : null,
    fetcher
  )

  return {
    contract: data?.contract,
    keyTerms: data?.key_terms ?? [],
    chatSessionId: data?.chat_session_id,
    isLoading,
    error,
    mutate,
  }
}
```

**SWR config:**
- `revalidateOnFocus: false` (contract data doesn't change automatically)
- No `refreshInterval` (only refetch on explicit `mutate()` call after an action)

---

### `useChatMessages`

**File:** `hooks/use-chat-messages.ts`

**Purpose:** Fetches and manages chat history for a contract session.

```typescript
import useSWR from 'swr'
import type { GetChatHistoryResponse, SendChatMessageResponse } from '@/types'

export function useChatMessages(contractId: string, sessionId: string) {
  const key = contractId && sessionId
    ? `/api/chat/${contractId}?session_id=${sessionId}`
    : null

  const { data, error, isLoading, mutate } = useSWR<GetChatHistoryResponse>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  )

  async function sendMessage(message: string): Promise<void> {
    // Optimistic update: append user message immediately
    const optimisticUserMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: message,
      page_citations: [],
      created_at: new Date().toISOString(),
    }

    await mutate(
      async (current) => {
        const res = await fetch(`/api/chat/${contractId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, message }),
        })
        if (!res.ok) throw new Error('Failed to send message')
        const aiMsg: SendChatMessageResponse = await res.json()

        return {
          session_id: sessionId,
          messages: [
            ...(current?.messages ?? []),
            optimisticUserMsg,
            {
              id: aiMsg.message_id,
              role: aiMsg.role,
              content: aiMsg.content,
              page_citations: aiMsg.page_citations,
              created_at: aiMsg.created_at,
            },
          ],
        }
      },
      {
        optimisticData: (current) => ({
          session_id: sessionId,
          messages: [...(current?.messages ?? []), optimisticUserMsg],
        }),
        rollbackOnError: true,
      }
    )
  }

  return {
    messages: data?.messages ?? [],
    isLoading,
    error,
    sendMessage,
  }
}
```

**Note:** The optimistic user message is shown immediately. The AI response is added when the API call resolves. On error, the optimistic update is rolled back (`rollbackOnError: true`).

---

### `useDashboard`

**File:** `hooks/use-dashboard.ts`

**Purpose:** Fetches the dashboard contract list with auto-refresh for processing contracts.

```typescript
import useSWR from 'swr'
import type { GetDashboardResponse } from '@/types'

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<GetDashboardResponse>(
    '/api/dashboard',
    fetcher,
    {
      refreshInterval: (data) => {
        const hasProcessing = data?.contracts.some(c => c.status === 'processing')
        return hasProcessing ? 5000 : 0
      },
    }
  )

  return {
    contracts: data?.contracts ?? [],
    stats: data?.stats,
    isLoading,
    error,
    mutate,
  }
}
```

---

### `useAuth`

**File:** `hooks/use-auth.ts`

**Purpose:** Convenience accessor for the `AuthContext`.

```typescript
import { useContext } from 'react'
import { AuthContext } from '@/contexts/auth-context'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

Returns: `{ user, session, isLoading, signOut }`

---

## SWR Global Fetcher

**File:** `lib/swr/fetcher.ts`

```typescript
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw Object.assign(new Error(error.message ?? 'Request failed'), { status: res.status })
  }
  return res.json()
}
```

This fetcher:
- Throws on non-2xx responses (so SWR treats them as errors)
- Attaches `status` to the error object for callers to check HTTP status code
- Used as the default fetcher for all SWR calls

**SWR Provider (configure in `app/layout.tsx`):**
```typescript
import { SWRConfig } from 'swr'
import { fetcher } from '@/lib/swr/fetcher'

// Wrap children in:
<SWRConfig value={{ fetcher }}>
  {children}
</SWRConfig>
```

---

## Zod Schemas

**File:** `lib/validation/schemas.ts`

All API request bodies are validated server-side with Zod:

```typescript
import { z } from 'zod'

export const UploadContractSchema = z.object({
  contract_type: z.enum(['NDA', 'MSA']),
  name: z.string().max(200).optional(),
})

export const ProcessContractSchema = z.object({
  custom_term_ids: z.array(z.string().uuid()).max(5).optional().default([]),
})

export const UpdateKeyTermSchema = z.object({
  value: z.string().min(1, 'Value cannot be empty').max(1000),
})

export const SendChatMessageSchema = z.object({
  session_id: z.string().uuid(),
  message: z.string().min(1).max(1000),
})

export const KeyTermExtractionSchema = z.object({
  terms: z.array(z.object({
    term_name: z.string().min(1),
    value: z.string().default(''),
    page_number: z.number().int().min(0),
    confidence_score: z.number().min(0).max(100),
    source_sentence: z.string().default(''),
  })),
})
```

---

## Tests

**Unit:**
- `useContract`: returns loading state; returns contract + keyTerms on success; returns error on failure
- `useChatMessages.sendMessage`: appends optimistic user message; appends AI response on success; rolls back on error
- `useDashboard`: sets `refreshInterval: 5000` when a contract is processing; sets `0` when all contracts are terminal
- `fetcher`: throws error with `status` attached for non-2xx response; returns parsed JSON for 2xx
- All Zod schemas: validate valid inputs without error; reject invalid inputs with descriptive messages
