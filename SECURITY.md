# Security & Privacy Policy

## Data Collection & Storage

This application is a **read-only food alternatives finder**. It does **not**:

- Collect or store any personal user data (names, emails, IP addresses beyond rate-limiting, etc.)
- Use cookies, sessions, or authentication tokens
- Track users across sessions
- Send any user data to third-party analytics services

The only data stored is the food nutrition database (seeded via `seed.py`) in a PostgreSQL instance.

---

## Security Controls Implemented

### API Security (FastAPI Backend)

| Control | Implementation |
|---|---|
| **CORS** | Locked to explicit origins via `ALLOWED_ORIGINS` env var — no wildcard |
| **Rate Limiting** | Global: 60 req/min · Search: 10/min · Alternatives: 20/min · Explain-swap: 10/min |
| **Host Header Injection** | `TrustedHostMiddleware` — only whitelisted hosts accepted |
| **Request Size** | Hard limit of 1 MB per request body |
| **SQL Injection** | SQLAlchemy ORM with parameterized queries throughout — no raw SQL |
| **Input Validation** | Pydantic schemas validate all inputs before DB access |
| **Error Exposure** | Exception objects never logged verbatim — only type name logged |
| **API Docs** | `/docs`, `/redoc`, `/openapi.json` disabled when `ENVIRONMENT=production` |
| **Security Headers** | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **Server Fingerprint** | `Server` header removed from all responses |

### Nginx Frontend

| Control | Implementation |
|---|---|
| **Security Headers** | X-Frame-Options DENY, CSP, HSTS, nosniff, XSS-Protection |
| **Server Tokens** | `server_tokens off` — nginx version hidden |
| **Proxy Timeouts** | connect 10s / read 30s / send 10s — Slowloris mitigation |
| **Server Info** | `Server` and `X-Powered-By` stripped from proxied responses |

### Docker / Infrastructure

| Control | Implementation |
|---|---|
| **DB Port** | PostgreSQL port NOT exposed to host — internal Docker network only |
| **Backend Port** | FastAPI port NOT exposed to host — proxied by Nginx over internal network |
| **Network Isolation** | All services on isolated `food_net` bridge network |
| **No Default Passwords** | `docker-compose.yml` uses `:?` syntax — fails fast if secrets are missing |
| **Secret Storage** | All credentials via environment variables, never hardcoded |

### Secrets Management

- **Never** commit `.env` files (they are in `.gitignore`)
- Use `.env.docker` as a template — it contains only placeholder values
- For production (Render): set `DATABASE_URL`, `ALLOWED_ORIGINS`, `ALLOWED_HOSTS`, `ENVIRONMENT=production` in the Render dashboard

---

## OWASP Top 10 Coverage

| OWASP Risk | Mitigation |
|---|---|
| A01 Broken Access Control | Read-only public API, no auth surface |
| A02 Cryptographic Failures | SSL enforced at DB level (`sslmode=require`), HSTS on frontend |
| A03 Injection | SQLAlchemy ORM parameterized queries, input length limits |
| A04 Insecure Design | No user-controlled DB writes, strict schema validation |
| A05 Security Misconfiguration | Security headers, server tokens off, no default passwords |
| A06 Vulnerable Components | Pin dependencies with `requirements.txt` |
| A07 Auth Failures | No authentication needed (public food data) |
| A08 Software & Data Integrity | Docker images from official registries only |
| A09 Logging Failures | Logs capture errors without leaking connection strings |
| A10 SSRF | No user-controlled URL/HTTP lookups in backend |

---

## Vulnerability Reporting

If you discover a security vulnerability, please report it directly to the project maintainer rather than creating a public GitHub issue.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DB_USER` | ✅ | PostgreSQL username |
| `DB_PASS` | ✅ | PostgreSQL password |
| `DB_NAME` | ✅ | PostgreSQL database name |
| `DATABASE_URL` | (cloud) | Full DSN — overrides individual DB_* vars |
| `ENVIRONMENT` | ✅ | Set to `production` to disable API docs |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated frontend origins for CORS |
| `ALLOWED_HOSTS` | ✅ | Comma-separated valid Host header values |
| `VITE_API_BASE_URL` | Build-time | Frontend API base URL (leave empty for same-origin) |
