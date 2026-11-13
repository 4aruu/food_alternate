---
name: project-audit
description: Perform a complete read-only assessment of the codebase, create a prioritized optimization plan, and design high-impact architectural and feature elevations.
---

# Complete Project Assessment, Optimization & Elevation Protocol

Execute all 3 phases below in **strict read-only mode** first. Write the full report to `docs/PROJECT_ROADMAP.md` and present a clear, actionable summary in chat. Do NOT modify application code until the user approves Phase 1.

## Phase 1: Deep Codebase Assessment
1. **Architecture & Stack Map:** Trace the full request/data lifecycle from frontend UI -> API layer -> services -> database/storage.
2. **Bottlenecks & Tech Debt:** Identify tightly coupled files, duplicated logic, N+1 queries, blocking async calls, missing input validation, and fragile error handling.
3. **Security & Config Hygiene:** Flag hardcoded secrets/URLs, missing auth/permission checks, permissive CORS, and unvalidated environment variables.
4. **Portability Check:** Note any local-only coupling (hardcoded paths, local file persistence, in-memory state) that would hinder future cloud hosting—flag them cleanly without adding cloud setup yet.

## Phase 2: Prioritized Optimization Plan (Fix & Harden)
Group improvements into small, PR-sized tasks ordered by impact and safety:
1. **Tier 1 — Critical Fixes & Stability:** Bugs, security gaps, broken error paths, and data integrity risks.
2. **Tier 2 — Performance & Query Speed:** Indexing, query batching, caching, payload trimming, and async concurrency.
3. **Tier 3 — Code Structure & Maintainability:** Decoupling bloated files, enforcing strict types/schemas, and adding targeted tests for core flows.

## Phase 3: Product & Architecture Elevation (Level Up)
Propose 3–5 concrete, high-leverage upgrades once the foundation is solid:
- **Developer Experience & Reliability:** Automated test coverage on critical paths, structured logging, and clean environment/config management.
- **Architecture & UX Polish:** Better latency/perceived speed, cleaner API contracts, or modular boundaries that make future cloud scaling effortless.

End by asking the user which **Tier 1** item they want to execute first.
