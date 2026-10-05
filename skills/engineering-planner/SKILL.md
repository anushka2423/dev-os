---
name: engineering-planner
description: >
   Transforms a PRD, product brief, feature request, or project description into a comprehensive Engineering Document (High-Level Design). Trigger when a user asks to create an engineering document, engineering doc, HLD, system architecture, technical design, or wants to convert requirements into a technical plan. The output defines the application architecture, technology stack, core components,data flow, APIs, database design, integrations, security considerations,deployment approach, and implementation roadmap before development begins. The output is a single markdown file `docs/engineering/hld-doc.md` that serves as the authoritative reference for the engineering team.
---

**Frontend:** Next.js (fixed — do not ask about frontend framework).

---

## Input

A PRD (Product Requirements Document) provided by the user — pasted text, a file path, or an uploaded document.

---

## Steps

1. **Analyze** the PRD — extract functional requirements, non-functional requirements, and gaps.
2. **Generate** `docs/engineering/hld-doc.md` (high-level architecture doc).

---

## Output: `docs/engineering/hld-doc.md`

Write this file with these sections in order:

1. **Executive Summary** — project name, business goal, problem statement, target users, success criteria
2. **Product Scope** — in scope / out of scope / future enhancements
3. **User Personas** — user types, responsibilities, permissions, primary workflows
4. **System Architecture Diagram** *(mandatory — always include, always first diagram in the doc)*

   Render a Mermaid `flowchart TD` diagram that shows the full system end-to-end. Rules:

   - **Numbered steps** — label every major hop with a circled number in the node text, e.g. `A["① Users"]`, `B["② Auth Service"]`
   - **System boundary** — wrap backend/cloud services in a `subgraph` with a descriptive title (e.g. `subgraph BACKEND["☁ Platform Backend"]`)
   - **Actor nodes** — users and external systems sit outside the subgraph
   - **Labeled arrows** — every edge carries a short label describing the action/data, e.g. `-->|"HTTP / REST"|`
   - **Parallel flows** — show multiple independent flows (e.g. user flow + background job flow) as separate vertical lanes in the same diagram
   - **Styling** — apply `classDef` for at least three node classes: `actor` (light blue fill), `service` (white fill, blue border), `db` (light green fill); assign them with `class` statements
   - Keep node labels short (≤ 4 words); put detail in the arrow label

   Example skeleton (replace with actual system components):
   ```mermaid
   flowchart TD
     classDef actor fill:#DBEAFE,stroke:#2563EB,color:#1E3A5F
     classDef service fill:#FFFFFF,stroke:#125ACB,color:#080A0E
     classDef db fill:#DCFCE7,stroke:#16A34A,color:#14532D
     classDef external fill:#F3F4F6,stroke:#6B7280,color:#374151

     U["① User / Browser"]:::actor

     subgraph FE["🖥 Frontend (Next.js)"]
       N["② Next.js App Router"]:::service
       S["③ State / Cache"]:::service
     end

     subgraph BE["☁ Backend"]
       A["④ API Routes"]:::service
       Auth["⑤ Auth Service"]:::service
       BL["⑥ Business Logic"]:::service
     end

     subgraph DATA["🗄 Data Layer"]
       DB["⑦ Supabase DB"]:::db
       Store["⑧ Storage"]:::db
     end

     EXT["⑨ External APIs"]:::external

     U -->|"HTTPS request"| N
     N -->|"API call"| A
     A -->|"verify token"| Auth
     Auth -->|"session"| A
     A -->|"process"| BL
     BL -->|"read / write"| DB
     BL -->|"files"| Store
     BL -->|"3rd-party call"| EXT
     EXT -->|"response"| BL
   ```

   After the diagram, add a **Flow Legend** table:

   | Step | Component | Responsibility |
   |------|-----------|----------------|
   | ① | User / Browser | Initiates all actions via HTTPS |
   | ② | … | … |

5. **User Flows** — every major journey (signup, login, dashboard, AI chat, file upload, search, payments, admin) using the format:
   ```
   User Action → Frontend Behavior → Backend Processing → Database Interaction → System Response
   ```
   For each journey also include a compact Mermaid `sequenceDiagram` showing the request/response chain between actor, frontend, backend, and database.

6. **Frontend Architecture** — Next.js stack (UI lib, state management, routing strategy), UX states (loading/empty/error/responsive/a11y), page and component hierarchy
7. **Backend Architecture** — stack, core systems (auth, authz, business logic, validation, middleware, error handling), service interaction diagram
8. **Database Design and schema** — per table: purpose, columns + types, relationships, constraints, indexes
9. **AI Architecture** *(only if AI features exist)* — LLM provider, model, prompt strategy, context/memory, token limits, rate limiting, cost controls, fallback
10. **API Specification** — per endpoint: method, path, purpose, auth required, request schema, response schema, validation rules, error responses
11. **Feature Breakdown** — Phase 1 (MVP), Phase 2, Phase 3 — each with: feature description, acceptance criteria, dependencies
12. **Folder Structure** — production-ready directory layout with purpose annotations
13. **Naming Conventions** — files, folders, components, hooks, services, APIs, DB tables, env vars, config files — with examples
14. **Testing Strategy** — unit, integration, and E2E with recommended frameworks and coverage targets
15. **Specs to Implementation Mapping** — for each spec, list the corresponding implementation files and the full flow from spec to code

---

## Requirements

- No vague statements — every section must be concrete and actionable
- The System Architecture Diagram (section 4) is **mandatory** — never skip it, never replace it with prose only
- The diagram must use real component names from the PRD, not the placeholder skeleton names
- Numbered steps in the diagram must match the Flow Legend table row-for-row
- `hld-doc.md` is the authoritative reference; no implementation begins until it is approved

---


