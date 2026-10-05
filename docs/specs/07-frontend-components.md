# Spec 07 — Shared Frontend Components

**Priority:** P0 (all components used in P0 flows)
**Functional Requirements:** All FRs (used universally)

---

## Overview

Shared UI primitives and layout components used across the entire app. All styles come from the allNeurons Design System v1.3.0 (`docs/design.md`). No third-party UI library — all components are custom-built with Tailwind CSS using design tokens.

---

## Design Token Reference

All components use these tokens from `docs/design.md`:

```
bg-page:    #FAFAFA    (page background)
bg-surface: #FFFFFF    (card/panel background)
ink-900:    #080A0E    (primary text)
ink-600:    #3D3F42    (secondary text)
ink-400:    #7E8185    (placeholder/muted text)
line-100:   #F0F0F0    (subtle divider)
line-200:   #DADADB    (standard border)
blue-600:   #125ACB    (primary action)
blue-700:   #0E469E    (primary hover)
blue-50:    #E6EFFC    (light blue fill)
green-500:  #12A10D    (success/high confidence)
orange-500: #FA9200    (warning/medium confidence)
red-500:    #D23438    (error/low confidence)
```

---

## UI Primitives

### `Button`

**File:** `components/ui/button.tsx`

**Props:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  children: React.ReactNode
  className?: string
}
```

**Variants:**

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| primary | `blue-600` (#125ACB) | white | none | `blue-700` |
| secondary | white | `blue-600` | `blue-600` 1px | `blue-50` bg |
| ghost | transparent | `ink-600` | none | `line-100` bg |
| danger | `red-500` | white | none | darker red |

**Sizes:**

| Size | Padding | Font | Height |
|------|---------|------|--------|
| sm | px-3 py-1.5 | text-sm | 32px |
| md | px-4 py-2 | text-sm | 40px |
| lg | px-6 py-3 | text-base | 48px |

**Loading state:** Replace children with spinner icon + retain width via `min-w-[...]`.

**Disabled state:** `opacity-50`, `cursor-not-allowed`, no hover effect.

**Spinner:** 20px SVG circle with animated stroke-dashoffset. Color matches text (white for primary, blue for secondary).

---

### `Badge`

**File:** `components/ui/badge.tsx`

**Props:**
```typescript
interface BadgeProps {
  variant: 'blue' | 'green' | 'orange' | 'red' | 'grey' | 'purple'
  size?: 'sm' | 'md'
  children: React.ReactNode
}
```

**Design (md size):** `px-2 py-0.5`, `text-xs`, `font-medium`, `rounded-full`

| Variant | Background | Text |
|---------|-----------|------|
| blue | `blue-50` | `blue-700` |
| green | `green-50` (#E7F7E7) | `green-700` (#0D720B) |
| orange | `orange-50` | `orange-700` |
| red | `red-50` | `red-700` |
| grey | `line-100` | `ink-600` |
| purple | `#F3F0FF` | `#5B21B6` |

**sm size:** `px-1.5 py-px`, `text-[10px]`

---

### `Tooltip`

**File:** `components/ui/tooltip.tsx`

**Props:**
```typescript
interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}
```

**Behaviour:**
- Appears on hover (300ms delay)
- Disappears after 200ms when cursor leaves
- Rendered via a portal to avoid clipping inside overflow containers
- Position defaults to `top`

**Design:**
- Background: `ink-900` (dark)
- Text: white, `text-xs`
- Padding: `px-2 py-1`
- `rounded-md`, `max-w-xs`, `z-50`
- Arrow pointing toward the trigger element

**Note:** Do not use Radix Tooltip or Headless UI at MVP — implement with `useState` + CSS positioning.

---

### `Input`

**File:** `components/ui/input.tsx`

**Props:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}
```

**Design:**
- Border: `line-200` by default; `blue-600` when focused; `red-500` when error
- Background: white
- `rounded-lg`, `px-3 py-2`, `text-sm`
- Label: above input, `text-sm`, `ink-600`, `font-medium`
- Error text: below input, `text-xs`, `red-700`
- Hint text: below input, `text-xs`, `ink-400`
- Focus ring: 2px `blue-50` outline

**Textarea variant:** same styles, auto-expands via `rows` prop + CSS `resize-none`.

---

### `Skeleton`

**File:** `components/ui/skeleton.tsx`

**Props:**
```typescript
interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}
```

**Design:**
- Background: `line-100` (#F0F0F0)
- Shimmer animation: `animate-pulse` (Tailwind) or custom keyframe
- `rounded-md` by default
- Use as loading placeholder for contract cards, term cards, etc.

---

### `Toast`

**File:** `components/ui/toast.tsx` + `contexts/toast-context.tsx`

**Context API:**
```typescript
interface ToastContextValue {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}
```

**Behaviour:**
- Toasts stack in the bottom-right corner (desktop) or bottom-center (mobile)
- Auto-dismiss after 4 seconds
- Maximum 3 visible at once (queue the rest)
- Slide-in from bottom animation
- Close button on each toast

**Design:**

| Type | Background | Icon |
|------|-----------|------|
| success | `green-50` + `green-700` border | Checkmark |
| error | `red-50` + `red-700` border | Warning |
| info | `blue-50` + `blue-600` border | Info circle |

Text: `ink-900`, `text-sm`, `max-w-xs`

**Usage:**
```typescript
const { showToast } = useToast()
showToast('Term saved successfully', 'success')
```

---

### `Modal`

**File:** `components/ui/modal.tsx`

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}
```

**Behaviour:**
- Rendered via portal at `document.body` level
- Backdrop: semi-transparent black (`rgba(0,0,0,0.4)`)
- Click outside or press Escape → calls `onClose`
- Focus trap (Tab cycles through focusable elements inside modal)
- Scroll lock on body while open

**Design:**
- `max-w-md`, centered on screen, `rounded-xl`
- White background (`bg-surface`)
- Padding: `p-6`
- Shadow: `shadow-xl`
- Title: `text-lg font-semibold ink-900`
- Footer: right-aligned button row

---

### `Divider`

**File:** `components/ui/divider.tsx`

**Props:** `label?: string`, `orientation?: 'horizontal' | 'vertical'`

**Design:** `line-200` (#DADADB), 1px, full width. Optional centred label in `ink-400`.

---

### `Spinner`

**File:** `components/ui/spinner.tsx`

**Props:** `size?: 'sm' | 'md' | 'lg'`, `color?: string`

**Design:**
- SVG circle with animated stroke: 1-second rotation cycle
- Sizes: sm = 16px, md = 24px, lg = 40px
- Color defaults to `blue-600`

---

## Layout Components

### `NavBar`

**File:** `components/layout/nav-bar.tsx`

**Props:** none (reads auth state from `useAuth` hook)

**Layout:**
- Fixed top, full width, `z-50`
- Height: 56px
- Background: `bg-surface` + bottom border `line-200`
- Padding: `px-6`

**Left:** ContractIQ logo (SVG wordmark) → links to `/dashboard`

**Right (authenticated):**
- User email (`ink-400`, `text-sm`, truncated at 200px)
- "New Contract" button (`secondary`, `sm`) → `/upload`
- Avatar or initials circle → opens dropdown:
  - "Sign Out" → calls `signOut()` from `useAuth`

**Right (unauthenticated):** "Sign In" (ghost) + "Get Started Free" (primary) buttons

**Mobile (< 768px):**
- Logo left, hamburger menu right
- Hamburger opens a full-height side drawer with the same nav links

---

### `AuthGuard`

**File:** `components/layout/auth-guard.tsx`

**Note:** Not a rendered component — implemented as server-side check in `app/(app)/layout.tsx`. See Spec 01 for details. This component is listed here for discoverability only.

---

### `PageContainer`

**File:** `components/layout/page-container.tsx`

**Props:** `children: React.ReactNode`, `maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'`

**Design:**
- `mx-auto`, `px-4 sm:px-6 lg:px-8`, `py-8`
- Max widths: sm=480px, md=640px, lg=1024px, xl=1280px, full=100%
- Background: `bg-page` (#FAFAFA) (inherited from body; container is transparent)

---

### `ErrorBanner`

**File:** `components/layout/error-banner.tsx`

**Props:** `message: string`, `onRetry?: () => void`

**Behaviour:**
- Shown when a page-level error occurs (e.g., contract in `error` status)
- Non-dismissible
- "Try again" button if `onRetry` is provided

**Design:**
- Background: `red-50`, border: `red-500`, `rounded-lg`
- Icon: warning triangle, `red-700`
- Text: `ink-900`
- Full-width at top of content area

---

## Custom Hooks

### `useToast`

**File:** `hooks/use-toast.ts`

Convenience wrapper for `ToastContext`:
```typescript
export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}
```

---

## Design Checklist

All components must:
- [ ] Use only design token colors (no raw hex in Tailwind classes — use CSS variable via `tailwind.config.js` extended colors)
- [ ] Support dark mode (not MVP — skip for now; leave tokens ready)
- [ ] Be accessible: correct ARIA roles, keyboard navigable, focus-visible rings
- [ ] Render correctly on mobile (375px viewport minimum)
- [ ] Never contain business logic (pure UI props in / actions out)

---

## Tests

**Unit:**
- `Button` (primary): renders spinner when `isLoading`; disabled when `disabled`; no hover on disabled
- `Badge`: applies correct color class per variant
- `Input`: shows error text when `error` prop is set; border turns red
- `Toast`: auto-dismisses after 4 seconds; renders success/error/info variants correctly
- `Tooltip`: shows on hover after delay; hides on mouse leave
- `NavBar`: shows user email when authenticated; shows Sign In button when not authenticated
