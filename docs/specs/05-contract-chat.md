# Spec 05 — Contract Chat

**User Stories:** US-007, US-012
**Priority:** P0 / P1
**Functional Requirements:** FR-08, FR-09

---

## Overview

After a contract is processed, the user can chat with it in a persistent, page-aware chat interface. The full contract text is passed on every turn (full-context RAG, no chunking). The AI extracts page citations from the contract text and includes them in responses. Chat history persists across sessions. The interface is embedded as a tab/panel on the results page.

---

## User Flow

```
Results page → "Chat" tab
  1. Chat history loads (if any previous messages exist)
  2. User types a question → presses Enter or clicks Send
  3. POST /api/chat/[contractId]
  4. AI streams response with page citations
  5. Response displayed with [Page N] links that navigate the PDF viewer
  6. User can thumbs up/down any AI message
  7. Next session: history persists — user returns and sees previous conversation
```

---

## API Routes

### `POST /api/chat/[contractId]`

**File:** `app/api/chat/[contractId]/route.ts`

**Auth:** Required. User must own the contract.

**Request body:**
```json
{
  "session_id": "uuid",
  "message": "What is the governing law clause?"
}
```

**Processing steps (in order):**

1. Validate JWT → get `userId`
2. Validate request body with Zod: `session_id` (uuid), `message` (string, 1–1000 chars)
3. Fetch chat session: verify `session_id` exists and belongs to user + contract
4. Fetch contract: `SELECT contract_type, contract_text FROM contracts WHERE id = $1 AND user_id = $2`
5. Verify contract status is `processed` → 422 if not
6. Fetch recent chat history: `SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 200`
7. Classify query type (client-side or light classification):
   - "What is X?" / "Does this contract..." → `extract` (answer from contract)
   - "Explain X" / "What does X mean?" → `explain` (interpret + educate)
   - "What should I look out for?" → `risk` (risk assessment)
   - All others → `general`
8. Build system prompt (see Prompt Spec)
9. Call OpenAI chat completions:
   ```typescript
   model: process.env.OPENAI_MODEL ?? 'gpt-4o',
   temperature: 0.4,
   max_tokens: 1000,
   messages: [systemMessage, ...historyMessages, userMessage]
   ```
10. Insert user message and AI response into `chat_messages`
11. Return AI response with extracted page citations

**Response 200:**
```json
{
  "message_id": "uuid",
  "role": "assistant",
  "content": "The governing law clause on Page 5 states that this agreement is governed by the laws of the State of Delaware. [Page 5]",
  "page_citations": [5],
  "created_at": "2026-10-05T09:01:00Z"
}
```

`page_citations`: array of page numbers extracted from `[Page N]` patterns in the AI response. Empty array if no citations.

**Error responses:**

| HTTP | Code | Message |
|------|------|---------|
| 400 | `INVALID_MESSAGE` | "Message cannot be empty or exceed 1000 characters." |
| 401 | `UNAUTHORIZED` | "Unauthorized" |
| 403 | `FORBIDDEN` | "You do not have access to this contract." |
| 404 | `SESSION_NOT_FOUND` | "Chat session not found." |
| 422 | `CONTRACT_NOT_PROCESSED` | "This contract has not been processed yet. Please run extraction first." |
| 502 | `AI_UNAVAILABLE` | "AI service is temporarily unavailable. Please try again in a moment." |

On 502: do NOT insert user message into DB — user can retry without duplicate messages appearing.

---

### `GET /api/chat/[contractId]`

**File:** `app/api/chat/[contractId]/route.ts` (GET handler on same file)

**Auth:** Required. User must own the contract.

**Query params:** `session_id` (required)

**Processing:**
1. Validate JWT → userId
2. Verify session belongs to user + contract
3. Return all messages ordered by `created_at ASC`

**Response 200:**
```json
{
  "session_id": "uuid",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "What is the governing law?",
      "page_citations": [],
      "created_at": "2026-10-05T09:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "The governing law clause on Page 5...",
      "page_citations": [5],
      "created_at": "2026-10-05T09:00:02Z"
    }
  ]
}
```

---

## AI Chat Module: `lib/openai/chat.ts`

```typescript
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResult {
  content: string
  pageCitations: number[]
}

export async function sendChatMessage(
  contractText: string,
  contractType: 'NDA' | 'MSA',
  history: ChatMessage[],
  userMessage: string
): Promise<ChatResult>
```

**Page citation extraction:**
After receiving the AI response, extract page numbers:
```typescript
function extractPageCitations(text: string): number[] {
  const matches = text.matchAll(/\[Page (\d+)\]/gi)
  return [...new Set([...matches].map(m => parseInt(m[1], 10)))]
}
```

**OpenAI retry:** Same 3-attempt exponential backoff as extraction (1000ms/2000ms/4000ms). All failures → throw `ChatUnavailableError` → API returns 502.

---

## Chat System Prompt

**File:** `lib/openai/prompts.ts` (exported as `buildChatSystemPrompt`)

```
You are a contract review assistant helping a non-lawyer understand the contents of their {NDA|MSA}.

You have been given the full text of the contract. Your job is to:
1. Answer questions accurately using ONLY the contract text provided
2. Cite the exact page number when referencing a clause: write "[Page N]" inline
3. If the answer is not in the contract, say "I couldn't find this in the contract."
4. If a clause is ambiguous, explain the ambiguity
5. Never provide personal legal advice — always suggest consulting a lawyer for critical decisions

IMPORTANT:
- Never invent information not in the contract
- Always cite page numbers using [Page N] format
- Keep responses concise and plain-English (assume reader is a founder, not a lawyer)
- If the user asks about a clause that has low confidence in the extraction, note that the AI may have been uncertain

CONTRACT TYPE: {contractType}

CONTRACT TEXT:
{contractText}
```

**History format for OpenAI:**
```typescript
const messages = [
  { role: 'system', content: systemPrompt },
  ...history.map(m => ({ role: m.role, content: m.content })),
  { role: 'user', content: userMessage }
]
```

Do not include more than 200 history messages (SELECT LIMIT 200 in step 6 above).

---

## DB Writes: `chat_messages`

**Insert user message:**
```typescript
await adminClient.from('chat_messages').insert({
  session_id: sessionId,
  user_id: userId,
  role: 'user',
  content: userMessage,
  page_citations: [],
})
```

**Insert AI response:**
```typescript
await adminClient.from('chat_messages').insert({
  session_id: sessionId,
  user_id: userId,
  role: 'assistant',
  content: aiResponse,
  page_citations: pageCitations,
})
```

Both inserts must succeed before returning the response. If the AI response insert fails, return 500 — the user message is already saved but AI message is lost; the client can retry.

---

## Frontend Components

### `ChatTab`

**File:** `components/chat/chat-tab.tsx`

**Props:** `sessionId: string`, `contractId: string`, `onPageCitation: (page: number) => void`

**States:** Loading history → Ready → Typing (user is composing) → Sending → Receiving AI response

**Behaviour:**
- On mount: `GET /api/chat/[contractId]?session_id=...` to load history via SWR
- Displays messages in chronological order (oldest at top, newest at bottom)
- Auto-scrolls to bottom on new messages
- Input is a textarea (auto-expanding, max 4 rows)
- Submit on Enter (without Shift); Shift+Enter for newline
- Disables input while AI is responding
- Shows typing indicator (`...` animation) while waiting for AI response

---

### `ChatMessage`

**File:** `components/chat/chat-message.tsx`

**Props:** `message: ChatMessageRecord`, `onPageClick: (page: number) => void`

**Behaviour:**
- User messages: right-aligned, `blue-600` background, white text
- AI messages: left-aligned, `bg-surface` (white), `ink-900` text, subtle border
- Renders page citations as clickable links: `[Page 5]` → `<button onClick={() => onPageClick(5)}>Page 5</button>`
- Link color: `blue-700`, underline, bold
- Timestamp shown below each message in `ink-400`

**AI message special handling:**
- Parse `[Page N]` patterns in the content string and render them as page-navigation buttons
- Render the remaining text as-is (no markdown parsing at MVP)

---

### `ChatInput`

**File:** `components/chat/chat-input.tsx`

**Props:** `onSend: (message: string) => void`, `isLoading: boolean`

**Behaviour:**
- Auto-expanding textarea, max 4 rows before scrolling
- "Send" icon button (right side, `blue-600` when active, `ink-300` when disabled)
- Disabled when `isLoading` or textarea is empty
- Clears input after send
- Shows character count near limit: appears when > 900 chars, red at 1000 chars
- Max 1000 chars enforced at input level

---

### `TypingIndicator`

**File:** `components/chat/typing-indicator.tsx`

**Props:** none

**Design:**
- Three animated dots (`...`) in grey, fading in/out in sequence
- Displayed in a left-aligned message bubble (same style as AI messages)
- Shown only while awaiting AI response

---

### `EmptyChat`

**File:** `components/chat/empty-chat.tsx`

**Props:** `contractType: 'NDA' | 'MSA'`

**Renders:**
- Icon + "Ask anything about this contract" heading
- 3 suggested prompts (clickable chips) based on contract type:
  - **NDA:** "What are the confidentiality obligations?", "How long does this NDA last?", "What happens if either party breaches?"
  - **MSA:** "What is the liability cap?", "What are the payment terms?", "How can either party terminate?"
- Clicking a chip pre-fills the chat input and triggers send

---

## Page Citation Navigation

When any `[Page N]` is clicked in the chat:
1. The `onPageCitation` callback is called with `page: N`
2. The parent results page updates `activePage` state
3. The PDF viewer / text viewer scrolls to that page

This is the same `activePage` mechanism used by the key terms panel — both the chat and the key terms panel share the same left-panel viewer.

---

## Edge Cases

| Scenario | Handling |
|----------|---------|
| User sends message while AI is responding | Input is disabled — not possible |
| AI response references a page that doesn't exist in the contract | Citation still links; scroll target is the last page instead |
| AI response contains `[Page 0]` | Filter out page 0 from citations (invalid) |
| Message history reaches 200 messages | History still loads and displays correctly; oldest messages sent to OpenAI are the 200 most recent |
| Contract text exceeds 15k tokens | Contract was already rejected at upload time — this should not occur; guard with 422 if it slips through |
| Network drops mid-response | Fetch throws → catch → show "Message failed to send. Please try again." → re-enable input |
| User refreshes page | History reloads via `GET /api/chat/[contractId]`; no messages lost |
| User opens contract in two browser tabs | Both tabs can send messages independently; history reflects order of DB inserts |
| Empty AI response from OpenAI | Show "I wasn't able to generate a response. Please try again." — do not insert empty message |

---

## Acceptance Criteria

- [ ] User can send a question and receive a grounded response referencing the contract
- [ ] Page citations in AI responses are clickable and navigate the PDF viewer
- [ ] Chat history persists across page refreshes and new sessions
- [ ] A fresh contract (no messages) shows the `EmptyChat` prompt chips
- [ ] Suggested prompt chips pre-fill and send on click
- [ ] Input is disabled while AI is responding; typing indicator is visible
- [ ] Responses load within 15 seconds P95
- [ ] Messages containing "Not legal advice" framing appear when AI makes recommendations
- [ ] Long conversation histories (200+ messages) load without pagination errors
- [ ] API key is never visible in any client-side request or response

---

## Tests

**Unit:**
- `extractPageCitations`: returns `[1, 5]` from "See page [Page 1] and [Page 5]"
- `extractPageCitations`: returns `[]` from text with no citations
- `extractPageCitations`: deduplicates repeated citations
- `ChatMessage`: renders page citation as a button; calls `onPageClick` on click
- `ChatInput`: disabled when `isLoading`; clears input after send

**Integration:**
- `POST /api/chat/[contractId]`: saves user + assistant messages; returns citations array
- Wrong user JWT → 403
- Message over 1000 chars → 400
- Session belonging to different user → 403
- OpenAI failure (mocked) → 502; no messages inserted

**E2E:**
- Open processed contract → chat tab → send question → AI response appears with page citations
- Click page citation → PDF viewer scrolls to correct page
- Refresh page → chat history still present
- Click suggested prompt chip → message sent, response received
