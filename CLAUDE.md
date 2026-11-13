# Project Context & Stack Rules

## Commands

- Backend test & lint: `pytest && ruff check .`
- Frontend build & lint: `npm run build && npm run lint`

## Directory Map

- `backend/app/api/` — FastAPI routers and Pydantic request validation
- `backend/app/services/` — Deterministic health-recommendation and alternative engines
- `backend/app/db/` — SQLAlchemy models and Alembic migrations
- `frontend/src/components/` — React UI components and feature modals

## Active Project Constraints & Tier 1 Guardrails

### Database Driver
- SQLAlchemy connection strings must use `postgresql+psycopg://` (psycopg v3) to match `requirements.txt`.

### Security
- Never store plaintext passwords or sensitive user form data in `localStorage`.
- Never expose secrets, credentials, API keys, or environment variables.

### Domain Logic
- Reject unknown allergens explicitly.
- Never treat missing nutrition data as a safe default.
- Never use loose OR matching for dietary filters.

### System Health
- `/health` must return `503` when the database is down.
- Public landing pages must not block rendering while waiting on health checks.

## GitHub Privacy and AI Attribution Rules

### Commit and Push Restrictions
- Never commit or push changes automatically.
- Every Git commit and push requires explicit user authorization.
- Never push code, files, screenshots, logs, traces, reports, or generated artifacts without approval.
- Never modify Git remotes, branches, repository settings, or Git configuration without approval.

### AI Attribution
- Do not add Claude, Anthropic, MCP, AI-generated, or similar attribution to source code, comments, commit messages, documentation, or metadata unless explicitly requested.
- Do not add AI-related signatures or automatically generated contributor attribution.
- Preserve the user's existing Git history and authorship.

### Change Review
- Before any commit, inspect `git status`, `git diff`, and `git diff --cached`.
- Review untracked files before staging.
- Never use `git add .` without first inspecting all changed and untracked files.
- Do not discard, reset, or overwrite existing user changes.
- Present a summary of modifications and wait for approval before committing or pushing.

### Testing Artifacts
- Keep temporary browser-testing artifacts outside the project repository whenever possible.
- Do not commit Playwright screenshots, browser traces, logs, or test reports unless explicitly requested.
- Do not install additional packages or modify project configuration without approval.

### General Rule
- Claude Code and MCP tools act as private development assistants.
- The user retains control over source-code changes, Git history, commits, and publication.
- Local development and testing must not automatically result in GitHub changes.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues for `4aruu/food_alternate`, accessed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/` (created lazily). See `docs/agents/domain.md`.
