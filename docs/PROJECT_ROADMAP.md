# Project Roadmap — Food Alternatives (NutriSwap)

_Audit date: 2026-11-12 · Mode: read-only · Baseline: `main` @ `bcc7b13` + uncommitted working-tree changes (16 files)_

Baseline checks run during the audit:

| Check | Result |
|---|---|
| `pytest -q` (backend, local venv) | ✅ 38 passed, 4 Pydantic deprecation warnings |
| `pytest --cov=.` (exactly as CI runs it) | ❌ `unrecognized arguments: --cov` — `pytest-cov` is not installed |
| `ruff check .` | ✅ clean |
| SQLAlchemy dialect for `postgresql://` | resolves to **psycopg2**, which is not in `requirements.txt` |
| Seed data | 231 foods, all with curated nutrition (no random fallback values today) |

---

## Phase 1 — Assessment

### 1.1 Architecture & request lifecycle

```
Browser (React 18 + Vite SPA, Vercel / Render static / nginx in Docker)
  │
  ├─ <BackendWakeUp> gates the ENTIRE app on GET /health (retries, cold-start UX)
  │
  ├─ utils/api.js  getFoods()  ── GET /foods/  (module-level promise cache, 1 call/session)
  │      └─ Header, search page, comparison tool, nutrition modal all filter this list in-browser
  │         (search, category filters, AND the "smart swap" health-goal engine run client-side)
  │
  └─ SmartSwapButton ── axios POST /foods/explain-swap {original, alternative}  (by NAME)

FastAPI (gunicorn + 2 uvicorn workers, Render free tier)
  main.py: logging → slowapi → body-size MW → security-headers MW → CORS → TrustedHost
           Base.metadata.create_all() at import time
  routers/foods.py (591 lines — routing + validation + business rules + templates)
     GET  /foods/                    in-process 120s TTL cache → joinedload ×3
     GET  /foods/search              ILIKE name/category        (unused by frontend)
     GET  /foods/{id}                                            (unused by frontend)
     GET  /foods/{id}/alternatives   medical rule engine + 2 fallbacks (unused by frontend)
     GET  /foods/meta/health-goals                               (unused by frontend)
     POST /foods/explain-swap        name lookup → rule-based benefit text
  database.py: SQLAlchemy sync engine (pool 2+2) → PostgreSQL (Aiven)
  seed.py: drop_all → create_all → insert 231 foods → compute healthy_alternative_id (never exposed)
```

**Key structural finding:** the backend's medically-documented recommendation engine (`/alternatives`) is **not used**. The UI runs its own, different engine (`getSmartSwaps` in `nutrition-explorer-modal/index.jsx`). Two engines with diverging rules both claim medical validity.

### 1.2 Bottlenecks & tech debt

| # | Location | Issue |
|---|---|---|
| D1 | `routers/foods.py:490` | `async def explain_swap` performs **sync** SQLAlchemy calls → blocks the event loop of that worker for every other request. |
| D2 | `routers/foods.py:302–411` | Allergen-filter block copy-pasted 3×; goal rules duplicated between strict and relaxed paths. `joinedload` + explicit `.join(Nutrition).join(Allergen)` emits each join twice. |
| D3 | `routers/foods.py:357, 409` | `ORDER BY nutrition_score DESC` → PostgreSQL puts **NULLs first**; comment says "better than original" but no `>` filter exists. |
| D4 | `routers/foods.py:499–505` | `ilike(user_input)` without escaping — input `%` matches an arbitrary first food; then 2 lazy loads (N+1-style, 4 queries total). |
| D5 | `nutrition-explorer-modal/index.jsx:11–80` | Client swap engine duplicates & contradicts backend rules (see T1-4). |
| D6 | `main.py:50` vs `foods.py:39` | Two `Limiter` instances; `default_limits=["60/minute"]` is dead config (no `SlowAPIMiddleware`). |
| D7 | `main.py:121`, `database.py` | Import-time side effects: `load_dotenv()`, engine creation, `create_all()`; tests must monkey-patch modules before import (`conftest.py` E402 workaround). |
| D8 | `seed.py:940` | Seed **drops all tables** unconditionally — one mistaken run against prod wipes data. No migrations (Alembic) exist. |
| D9 | `models.py` | No index/unique on `nutrition.food_id`, `allergens.food_id`, `sustainability.food_id`; `foods.category` filtered but unindexed; `sustainability_score` duplicated on two tables; `allergens.shellfish` actually stores fish **or** shellfish. |
| D10 | `schemas.py` | Class-based `Config` (deprecated); `explain-swap` & `health-goals` lack `response_model`. |
| D11 | Frontend | No route-level code splitting (0 × `React.lazy`); `d3`, `redux`, `@reduxjs/toolkit`, `react-helmet`, `react-hook-form`, `date-fns` imported nowhere; `axios` used once alongside `fetch`. |
| D12 | Frontend | Dead links: `/user-dashboard`, `/saved-alternatives`, `/profile-settings`, `/dietary-preferences`, `/help` → 404. |
| D13 | `nutrition-explorer-modal/index.jsx:139` | Page depends on `location.state.food`; refresh/deep link renders `null` (blank screen). |

### 1.3 Security & config hygiene

| # | Severity | Finding |
|---|---|---|
| S1 | **High** | `user-registration/index.jsx:39–42` writes the full form — **including plaintext `password` and `confirmPassword`** — to `localStorage` on every keystroke; it survives until registration "completes". |
| S2 | **High** | Auth is entirely mocked: any email/password "logs in"; social login fabricates users. The UI presents security it does not have. |
| S3 | Medium | `render.yaml` backend declares only `DATABASE_URL`. Without `ENVIRONMENT=production`, `/docs` + `/openapi.json` are public; without `ALLOWED_HOSTS` including the `onrender.com` host, `TrustedHostMiddleware` rejects every request with 400. _(Verify dashboard values — may be set manually.)_ |
| S4 | Medium | Unknown `avoid=` allergens (e.g. `sesame`, `mustard`) are **silently dropped** → results may contain the allergen the user asked to avoid. Violates CLAUDE.md "no silent fallbacks". |
| S5 | Low | `MaxBodySizeMiddleware`: non-numeric `Content-Length` → `ValueError` → 500; chunked bodies bypass the check. |
| S6 | Low | `rate_limit_key` trusts right-most `X-Forwarded-For` — correct behind Render, spoofable when the port is exposed directly (local/other hosts). `FORWARDED_ALLOW_IPS=*` baked into the image. |
| S7 | Low | `security-scan.yml`: Trivy `exit-code: 0`, ZAP `fail_action: false` → never fails. The scanned nginx image has `proxy_pass http://backend:8000` and is run standalone, so nginx likely fails to resolve the upstream and exits → ZAP may be scanning nothing. |
| S8 | Info | `.env.docker` is tracked and contains non-placeholder-looking values (`DB_PASS=CHA…`). Confirm it holds only placeholders. `.env`/`.env.local` are correctly git-ignored. |

CORS is tight (explicit origins, GET/POST, no credentials) and security headers are good. No hardcoded secrets in source.

### 1.4 Portability (cloud-readiness flags — no action yet)

- **DB driver/URL coupling:** URL built as `postgresql://` → psycopg2 (not installed). `postgres://` (Aiven/Render style, documented in `render.yaml`) is rejected by SQLAlchemy outright.
- **No config module:** `os.getenv` scattered across `main.py`/`database.py`; `ENVIRONMENT` parsed 4× in `main.py`; localhost defaults for origins/hosts.
- **Per-process state:** rate limits and the foods cache are in-memory per gunicorn worker (effective limit = limit × workers; caches can diverge for up to 120s). Fine today; needs Redis/shared store at scale.
- **Schema via `create_all`:** no migrations → schema changes on a hosted DB require manual work or the destructive seed.
- **Dual frontend hosting:** `render.yaml` static site **and** CI deploy to Vercel — two production frontends with different env.
- **Prod image** contains `pytest`/`httpx` and needless `gcc`/`libpq-dev` (psycopg[binary] ships its own libpq).
- **No graceful shutdown:** no FastAPI `lifespan` / `engine.dispose()`.

---

## Phase 2 — Prioritized Optimization Plan

Each item is sized as one PR. Order within a tier = recommended execution order.

### Tier 1 — Critical fixes & stability

| ID | Task | Files | Why now | Verify by |
|---|---|---|---|---|
| **T1-1** | **Fix DB driver/URL:** normalize `postgres://`/`postgresql://` → `postgresql+psycopg://` in `database.py` (and build the DB_* URL with that scheme). | `database.py` (+ test) | docker-compose path is guaranteed to crash (`No module named psycopg2`); Render works only if the dashboard URL already says `+psycopg`. | Unit test for URL normalization; `docker compose up` boots. |
| **T1-2** | **Unbreak CI:** add `pytest-cov` (dev reqs) and pin `ruff`. Split `requirements-dev.txt` so prod image drops pytest/httpx. | `requirements*.txt`, `ci-cd.yml`, `Dockerfile` | Backend CI cannot pass → `deploy` job (needs: backend-ci) never runs. | CI green on a PR. |
| **T1-3** | **Stop persisting passwords:** exclude `password`/`confirmPassword` from the `localStorage` draft; fix post-registration redirect `/user-dashboard` → `/dashboard`. Label mock auth as demo (or hide it). | `user-registration/index.jsx`, `user-login/index.jsx` | Plaintext credentials at rest in the browser. | Manual: fill form, inspect `localStorage`. |
| **T1-4** | **Make allergen & goal handling honest (backend):** reject unknown allergens with 400 (list valid ones); add `NULLS LAST`; filter default path to `nutrition_score > original`; return a `match: "strict" \| "relaxed"` indicator when thresholds are relaxed; dedupe the allergen filter helper. | `routers/foods.py`, `schemas.py`, tests | Allergen safety is the product's core promise; today a user avoiding sesame gets no warning. | New tests: unknown allergen → 400; relaxed results flagged; NULL scores sort last. |
| **T1-5** | **Fix `explain-swap`:** make it `def` (threadpool) not `async def`; escape `%`/`_`; eager-load nutrition in one query; frontend must not invent "This is a smarter choice…" on error — show a neutral failure state. | `routers/foods.py`, `SmartSwapButton.jsx` | Event-loop blocking under load; fabricated health claims. | Tests for `%` input; manual error-state check. |
| **T1-6** | **Truthful `/health`:** return 503 when DB is down (or split `/health` liveness vs `/ready` readiness); guard `Content-Length` parse. | `main.py`, `test_health.py` | Uptime pingers / `BackendWakeUp` currently get 200 with a dead DB. | Test with failing session → 503. |
| **T1-7** | **Render config completeness:** declare `ENVIRONMENT`, `ALLOWED_ORIGINS`, `ALLOWED_HOSTS` (sync:false) in `render.yaml`; pick **one** frontend host (Vercel or Render static) and remove the other. | `render.yaml`, `ci-cd.yml` | Prevents exposed docs / 400s on fresh deploys; removes split-brain frontends. | Fresh Render blueprint deploy. |
| **T1-8** | **Nutrition modal deep-link:** carry `?id=` in the URL and resolve from `getFoods()` when `location.state` is missing; render loading/not-found states. | `nutrition-explorer-modal/index.jsx`, callers | Refresh/shared link = blank page. | Manual refresh test. |

### Tier 2 — Performance & query speed

| ID | Task | Impact |
|---|---|---|
| T2-1 | **Don't gate the whole SPA on `/health`.** Render landing/marketing routes immediately; show the wake-up UI only on data routes (or inline skeletons). | Largest perceived-speed win: first paint no longer waits on Render cold start (often 30–60s). |
| T2-2 | **Route-level code splitting** (`React.lazy` + `Suspense`) for comparison tool, nutrition modal, dashboard, registration; drop unused deps (`d3`, `redux`, `@reduxjs/toolkit`, `react-helmet`, `react-hook-form`, `date-fns`) and the `d3` manualChunk; replace the single `axios` call with `apiFetch`. | Smaller initial JS; faster TTI on mobile. Measure with `vite build` size output before/after. |
| T2-3 | **Alternatives query cleanup:** `contains_eager` instead of `joinedload` + duplicate `join`; single query builder for strict/relaxed. | Fewer joins per call; less code. |
| T2-4 | **Indexes + constraints** (via first Alembic migration, see T3-3): unique index on each `*.food_id`, index on `foods.category`. | Small at 231 rows; correctness (1:1 enforced) matters more than speed here. |
| T2-5 | **ETag / `Cache-Control` on `/foods/`** keyed on a dataset version; replace two `BaseHTTPMiddleware` layers with one pure-ASGI middleware. | Conditional GETs return 304; lower per-request overhead on 0.1 CPU. |

### Tier 3 — Structure & maintainability

| ID | Task |
|---|---|
| T3-1 | **`config.py` settings module** (single validated source for DB URL, ENVIRONMENT, origins, hosts, limits); FastAPI `lifespan` for startup/`engine.dispose()`; remove import-time `create_all`. Simplifies `conftest.py` (no E402 hacks). |
| T3-2 | **Split `routers/foods.py`:** `services/alternatives.py` (goal rules as a data table driving both filter and relaxed sort), `services/swap_explainer.py`, `domain/allergens.py`. Router keeps only HTTP concerns. One `Limiter`. |
| T3-3 | **Alembic migrations** + make `seed.py` idempotent (upsert by name) and refuse `drop_all` unless `--reset` and non-production. |
| T3-4 | **Schemas:** `ConfigDict`, `response_model` everywhere, rename `allergens.shellfish` → `seafood` (or split fish/shellfish), drop duplicated `sustainability_score`, expose or remove `healthy_alternative_id`. |
| T3-5 | **Frontend hygiene:** remove dead links/routes, add a `src/services/` layer for data hooks (`useFoods`, `useAlternatives`) separating fetching from presentation; add ESLint (package.json references `react-app` config that isn't installed) and Vitest. |
| T3-6 | **Security scan that can fail:** scan the backend image too, run the frontend container with a stub upstream (or `resolver` + variable `proxy_pass`), set Trivy `exit-code: 1` for CRITICAL. |

---

## Phase 3 — Product & Architecture Elevation

1. **One canonical recommendation engine (API-first).** Make `/foods/{id}/alternatives` the only engine; the UI calls it with the user's goal + allergen profile. Response carries `match: strict|relaxed`, `reasons[]` per item (e.g. "−12 g sugar", "allergen-free: dairy"), and merges `explain-swap` into it (no second round-trip, lookup by ID not name). Back it with **golden-fixture tests per health goal**. _Why:_ removes the duplicated/contradictory medical logic, makes claims auditable, and is the product's core value.
2. **Honest user profile instead of fake auth.** Replace mock login/registration with a local "My profile" (diet + allergens + goals, stored client-side, no passwords) that pre-fills `avoid=`/`health_goal`. Add real auth (managed provider) only when server-side persistence (favorites, history sync) is actually needed. _Why:_ delivers the personalisation users see today, without the security liability.
3. **Static dataset delivery.** The food data is seeded and read-only: emit a versioned `foods.<hash>.json` at deploy time, serve it from the CDN (Vercel) with immutable caching, and keep the API for computation only. _Why:_ browse/search works instantly even while the Render backend is cold, slashes DB load, and keeps hosting swappable.
4. **Operational baseline.** Request-ID middleware threaded through JSON logs, access logs with latency, error reporting (e.g. Sentry free tier) on both tiers, and a `/ready` probe. _Why:_ today a production failure is only visible as a spinner.
5. **Reproducible data pipeline.** Alembic + idempotent seed + a CI job that boots Postgres (service container), runs migrations and seed, and executes the test suite against real Postgres (SQLite hides dialect issues like `NULLS FIRST` and the psycopg driver bug found here).
