# Spec 01 — Authentication

**User Story:** US-001
**Priority:** P0
**Functional Requirement:** FR-01

---

## Overview

Email/password authentication via Supabase Auth. Session persists via Supabase SSR cookies across page reloads and tab restores. All protected routes redirect to `/signin` if no valid session exists. The OpenAI API key is never accessible on the client — auth only controls access to the React UI and Supabase data.

---

## User Flow

```
Landing page
  → Click "Get Started Free" → /signup
  → Enter email + password
  → supabase.auth.signUp() → email verification sent
  → User clicks verification link in email
  → Supabase issues session token
  → Redirect to /dashboard

Returning user:
  → Click "Sign In" → /signin
  → Enter email + password
  → supabase.auth.signInWithPassword()
  → Session issued → redirect to /dashboard

Sign out:
  → Click "Sign Out" in nav
  → supabase.auth.signOut()
  → Session cleared → redirect to /
```

---

## Database

Auth is managed entirely by Supabase Auth (`auth.users` table — no custom `users` table needed). Every application table references `auth.users(id)` via `user_id` foreign key. RLS policies use `auth.uid()` to isolate data per user.

No additional DB migrations needed for auth itself.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anon key (browser-safe)
SUPABASE_SERVICE_ROLE_KEY         # SERVER ONLY — bypasses RLS for server writes
```

---

## File Map

| File | Purpose |
|------|---------|
| `lib/supabase/client.ts` | Browser Supabase client (anon key) |
| `lib/supabase/server.ts` | Server Supabase client factory for API routes |
| `lib/middleware/auth.ts` | `withAuth(handler)` wrapper for API routes |
| `contexts/auth-context.tsx` | Global auth state: user, session, signOut |
| `app/(auth)/signup/page.tsx` | Sign-up page |
| `app/(auth)/signin/page.tsx` | Sign-in page |
| `app/(app)/layout.tsx` | Auth guard: redirects to /signin if no session |
| `components/layout/nav-bar.tsx` | Shows user email + Sign Out button when authenticated |
| `components/auth/sign-up-form.tsx` | Sign-up form component |
| `components/auth/sign-in-form.tsx` | Sign-in form component |
| `hooks/use-auth.ts` | Convenience hook: returns `{ user, session, signOut }` from AuthContext |

---

## Implementation Details

### `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Call from Server Components, Route Handlers, and Server Actions
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}

// Service-role client for server-side writes that bypass RLS
export function createAdminSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  )
}
```

### `lib/middleware/auth.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type RouteHandler = (req: NextRequest, user: { id: string; email: string }) => Promise<Response>

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest) => {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(req, { id: user.id, email: user.email! })
  }
}
```

### `contexts/auth-context.tsx`

- Wraps the app in `AuthContext`
- On mount: call `supabase.auth.getSession()` to initialise state
- Subscribe to `supabase.auth.onAuthStateChange` → update user/session state on every auth event
- Expose: `{ user, session, isLoading, signOut }`
- `signOut`: calls `supabase.auth.signOut()` → router.push('/')

### `app/(app)/layout.tsx` — Auth Guard

```typescript
// Server Component — runs before any (app) page renders
const supabase = createServerSupabaseClient()
const { data: { session } } = await supabase.auth.getSession()
if (!session) redirect('/signin')
```

---

## Component Specs

### `SignUpForm`

**Props:** none
**State:** `email: string`, `password: string`, `confirmPassword: string`, `isLoading: boolean`, `error: string | null`

**Behaviour:**
- All fields required
- Password min 8 characters (client-side validation before submit)
- `password !== confirmPassword` → show "Passwords do not match" before calling Supabase
- On submit: call `supabase.auth.signUp({ email, password })`
- Success: show "Check your email to verify your account" message (do not redirect yet — user must verify)
- Error `"User already registered"`: show "An account with this email already exists. Sign in instead."
- All other errors: show the Supabase error message

**Design:**
- White card centred on the page, max-width 400px
- ContractIQ logo above the card
- Primary button (blue-600 `#125ACB`) for "Create Account"
- Link below: "Already have an account? Sign in"

### `SignInForm`

**Props:** none
**State:** `email: string`, `password: string`, `isLoading: boolean`, `error: string | null`

**Behaviour:**
- On submit: call `supabase.auth.signInWithPassword({ email, password })`
- Success: router.push('/dashboard')
- Error `"Invalid login credentials"`: show "Incorrect email or password"
- All other errors: show Supabase error message
- No redirect if loading (button shows spinner, is disabled)

**Design:** same card pattern as SignUpForm; link: "Don't have an account? Get started free"

---

## Edge Cases

| Scenario | Handling |
|----------|---------|
| User navigates to `/dashboard` without a session | Auth guard in `(app)/layout.tsx` redirects to `/signin` |
| Session expires mid-session | `onAuthStateChange` fires → AuthContext clears user → next API call returns 401 → toast "Your session expired — please sign in again" → redirect to `/signin` |
| User submits sign-up with already-verified email | Supabase returns error → show "An account already exists" with link to sign-in |
| User clicks verification link after it expires | Supabase returns error → show "Verification link expired. Request a new one." with re-send button |
| Network error during sign-in | Catch fetch error → show "Network error — please try again" |
| User tries to access `/signin` or `/signup` while already logged in | `(auth)/layout.tsx` checks session and redirects to `/dashboard` |
| Empty form submission | HTML `required` attributes prevent submission; also validated before API call |

---

## Acceptance Criteria

- [ ] User can sign up with email + password; receives verification email
- [ ] After clicking verification link, user is redirected to `/dashboard`
- [ ] User can sign in with correct credentials; redirected to `/dashboard`
- [ ] Incorrect credentials show a clear error message
- [ ] Sign out clears session and redirects to landing page
- [ ] Unauthenticated access to any `/dashboard`, `/upload`, or `/contracts/[id]` URL redirects to `/signin`
- [ ] Auth flow completes (sign-in to dashboard) in ≤ 10 seconds
- [ ] No auth tokens or API keys appear in the browser network inspector responses
- [ ] Session persists across browser tab refresh without requiring re-login

---

## Tests

**Unit:**
- `SignInForm`: renders error on failed credentials mock; submit button disabled while loading
- `SignUpForm`: password mismatch shows error without API call; short password blocked

**Integration:**
- `GET /api/contracts/[id]` without Authorization header → 401
- `GET /api/contracts/[id]` with expired token → 401
- `GET /api/contracts/[id]` with valid token for different user → 403

**E2E (Playwright):**
- Full sign-up flow → email verification → dashboard empty state
- Sign-in → dashboard → sign-out → landing page
- Direct URL to `/dashboard` while logged out → redirect to `/signin`
