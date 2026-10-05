# Project Guide

This project uses a structured, step-by-step workflow to go from a product idea to a fully built app. Three skills drive the process. Follow the stages in order and **never move to the next stage without explicit user approval**.

---
## The Build Workflow

### Stage 1 — Engineering Plan
**Skill:** `/engineering-planner`
**Input:** A PRD or product description from the user
**Output:** `docs/engineering/engineering-doc.md` + `docs/engineering/implementation-specs.md`

Transform the user's requirements into two documents:
- `engineering-doc.md` — high-level architecture (stack, flows, DB design, API spec, folder structure)
- `implementation-specs.md` — one detailed spec block per feature (user flow, DB schema, DB tasks, API routes, state management, component spec, design, edge cases)

Before generating, use `AskUserQuestion` to resolve any missing architectural decisions (auth strategy, database, LLM provider, user roles, etc.).

When done, show the user what was created and ask:
> "Both engineering documents are ready in `docs/engineering/`. Review them and let me know when you're happy to move to Stage 2."

---

### Stage 2 — Implementation Specs
**Skill:** `/implementation-specs`
**Input:** `docs/engineering/engineering-doc.md` (from Stage 1)
**Output:** `docs/specs/` — detailed spec files + `docs/specs/supabase-schema.sql` + `.env.example`

Read the approved engineering plan and generate granular, runnable implementation specs. The LLM decides what spec files are needed based on the plan. Always includes:
- `docs/specs/supabase-schema.sql` — paste-and-run SQL for Supabase SQL Editor (tables, RLS policies, indexes, triggers)
- `.env.example` — every environment variable the app needs, grouped by service

When done, show the user what was created and ask:
> "All implementation specs are in `docs/specs/`. The Supabase schema SQL is ready to run. Review the specs and let me know when you're ready for Stage 3."

---

### Stage 3 — Frontend Setup
**Skill:** `/frontend-setup`
**Input:** Approved specs from Stage 2
**Output:** Scaffolded Next.js 14 (App Router) project with full folder structure

Scaffold the Next.js project based on the folder structure and conventions defined in the specs. Ask the user where to create the project folder before writing any files.

When done:
> "Your Next.js app is scaffolded and running. Folder structure is in place. Let me know when you're ready to move to Stage 4 — Feature Implementation."

---

### Stage 4 — Feature Implementation
**Input:** Spec files from `docs/specs/`
**Process:** Build all features end-to-end without stopping

1. Read all relevant spec files from `docs/specs/`
2. Implement every feature in sequence — do not stop or ask for confirmation between features
3. Apply `/design-system` to all frontend code; all colors, spacing, typography, and component styles must come from `docs/design.md`

When all features are implemented, ask:
> "All features are implemented. Ready to move to Stage 5 — Testing?"

---

### Stage 5 — Testing
**Input:** Implemented features from Stage 4
**Output:** Test suite covering unit, integration, and E2E flows

For each implemented feature:
1. Write unit tests for business logic and utility functions
2. Write integration tests for API routes and database interactions
3. Write E2E tests for critical user flows (auth, core feature paths)
4. Run the full test suite and fix any failures before proceeding

When all tests pass, ask:
> "All tests are passing. Ready to move to Stage 6 — Deploy?"

---

### Stage 6 — Deploy
**Input:** Tested, passing codebase from Stage 5
**Output:** Live production deployment

Steps:
1. Confirm environment variables are set in the deployment platform
2. Run the production build locally to catch any build errors
3. Deploy to the target platform (Vercel, Supabase, etc.)
4. Smoke test the live deployment against critical flows
5. Confirm the app is live and working

When deployed and verified, ask:
> "App is live. Ready to move to Stage 7 — Security Fixes?"

---

### Stage 7 — Security Fixes
**Skill:** `/security-foundation`
**Input:** Live deployed app + all engineering docs and specs
**Output:** `docs/security/security-plan.md` + `supabase/rls-policies.sql` + `src/lib/security/`

Review all engineering and spec documents, audit the deployed app, identify every security surface, and implement all required security controls. Covers auth, protected routes, API validation, rate limiting, prompt injection protection, token limits, chat security, file upload security, environment variable protection, and audit logging.

When done, show the user what was created and ask:
> "Security fixes are complete. All controls are documented in `docs/security/security-plan.md` and the service files are ready in `src/lib/security/`."

---

## Skills Reference

| Skill | Command | What it does |
|---|---|---|
| Engineering Planner | `/engineering-planner` | PRD → `docs/engineering/engineering-doc.md` + `docs/engineering/implementation-specs.md` |
| Implementation Specs | `/implementation-specs` | Engineering docs → granular spec files + `supabase-schema.sql` + `.env.example` |
| Frontend Setup | `/frontend-setup` | Scaffolds a Next.js 14 App Router project |
| Design System | `/design-system` | Enforces brand colors, typography, spacing, and component styles on all UI code |
| Security Foundation | `/security-foundation` | Implements all security controls → `docs/security/security-plan.md` + `supabase/rls-policies.sql` + `src/lib/security/` |

---

## Docs Reference

| File | Created by | Purpose |
|---|---|---|
| `docs/engineering/engineering-doc.md` | `/engineering-planner` | High-level architecture, flows, DB design, API spec |
| `docs/engineering/implementation-specs.md` | `/engineering-planner` | Per-feature specs (flow, DB, API, component, edge cases) |
| `docs/specs/*.md` | `/implementation-specs` | Additional granular specs derived from the engineering docs |
| `docs/specs/supabase-schema.sql` | `/implementation-specs` | Run this in Supabase SQL Editor to create all tables |
| `.env.example` | `/implementation-specs` | All environment variables — copy to `.env.local` and fill in values |
| `docs/security/security-plan.md` | `/security-foundation` | Security controls, audit log, RLS policies |

---

## Key Constraints

- **Never skip a stage.** Each stage depends on the output of the previous one.
- **Never proceed without user approval.** After every stage, stop and wait.
- **Never assume missing decisions.** Use `AskUserQuestion` when something is unclear.
- **Never write code before the specs exist.** Implementation only starts after Stage 2 is approved.