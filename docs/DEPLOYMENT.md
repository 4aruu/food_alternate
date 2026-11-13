# Deployment

How production is actually configured. There is no `render.yaml`: the Render service was created by hand in the dashboard, so the repository does not define it.

## Overview

| Part | Host | Deployed by |
|---|---|---|
| Backend (FastAPI) | Render web service **`food-alternate`** (Docker, root `./backend`) | The CI `deploy` job calls the Render deploy hook on every push to `main`, after the frontend and backend jobs pass. |
| Frontend (Vite/React) | Vercel project **`food-alternate`** | Vercel's own GitHub integration: production from `main`, preview deployments for other branches. CI has **no** Vercel step. |
| Database | Aiven free PostgreSQL | Not deployed. It's a managed service. |

## Backend: Render web service `food-alternate`

- **Runtime:** Docker, using `backend/Dockerfile` with `./backend` as the build context. The container runs gunicorn with uvicorn workers on `$PORT`.
- **Deploys:** a push to `main` runs `.github/workflows/ci-cd.yml`. When `frontend-ci` and `backend-ci` both pass, the `deploy` job `POST`s to the deploy hook stored in the GitHub secret `RENDER_DEPLOY_HOOK_URL`.
- **Created in the dashboard.** Settings live in Render, not in this repository.

### Required environment variables

These are set in the Render dashboard. This document lists names only; never commit values.

| Name | What it must contain |
|---|---|
| `DATABASE_URL` | The Aiven connection string, using the **`postgresql+psycopg://`** scheme (psycopg v3, the only driver installed). `postgres://` and `postgresql://` are rewritten to it automatically; any other scheme stops startup with an error. Keep the `sslmode` query parameter Aiven provides. |
| `ENVIRONMENT` | The production setting. It turns on JSON logs and turns off `/docs`, `/redoc` and `/openapi.json` (see `backend/main.py`). |
| `ALLOWED_ORIGINS` | Comma-separated frontend origins allowed by CORS: the Vercel production domain, plus any preview domains that must call the API. |
| `ALLOWED_HOSTS` | Comma-separated hostnames accepted by `TrustedHostMiddleware`. It **must** include the service's `onrender.com` hostname and **every** verified custom domain. Without them, requests get 400, and so do health checks (see below). |

`PORT` is provided by Render. `WEB_CONCURRENCY` is optional: when it isn't set, Render sets it from the available CPUs. The deploy log shows `Setting WEB_CONCURRENCY=1 by default, based on available CPUs`, so production runs **1** gunicorn worker. The Dockerfile's fallback of 2 applies only where nothing sets it, such as a local `docker run`. Each worker has its own connection pool of at most 4 connections, well within Aiven's 20-connection limit (see `backend/database.py`).

### Health checks

The backend has two endpoints:

- **`GET /livez`** (liveness): returns 200 `{"status":"alive"}` whenever the process is up. It never touches the database.
- **`GET /health`** (readiness): returns 200 `{"status":"ok","database":"connected"}`, or 503 `{"status":"unhealthy","database":"unreachable"}` when the database is down. It's for monitoring and for the frontend's wake-up screen.

**Render's Health Check Path:** set it to **`/livez`**, and only **after** a build containing `/livez` is live:

1. **Pre-flight:** open <https://food-alternate.onrender.com/livez> in a browser and confirm it returns 200 with `{"status":"alive"}`. A 404 means the build with `/livez` isn't live yet; a 400 means `ALLOWED_HOSTS` is missing the host (see below). Don't continue until it returns 200.
2. In the Render dashboard, set the service's Health Check Path to `/livez`.

Setting it before `/livez` is live makes every health check fail. Render restarts instances that fail health checks, and it cancels a deploy whose new instances don't pass within 15 minutes, while the old instances keep serving.

Don't use `/health` as the Health Check Path. During a database outage it returns 503, and Render would then restart a backend that is working fine, which doesn't bring the database back.

**Health checks and `TrustedHostMiddleware`:** `/livez` passes through `TrustedHostMiddleware` like every other route. Render's documentation (<https://render.com/docs/health-checks>) says HTTP health checks send `Host` set to one of the service's verified custom domains or, if there are none, the service's `onrender.com` subdomain. Public traffic uses those same hostnames, so a correct `ALLOWED_HOSTS`, which the API needs anyway, also lets health checks through. No middleware exemption is needed. The things to watch:

- **Custom domains:** when you add one, add it to `ALLOWED_HOSTS` **before** verifying it in Render. Render may pick *any* verified domain as the health-check `Host`.
- **Symptom of a missing host:** if `ALLOWED_HOSTS` misses the health-check host, `/livez` returns 400, every health check fails, and Render restarts the service in a loop. Fix `ALLOWED_HOSTS`, not the health check.

## Database: Aiven free PostgreSQL

- **Powering off:** the free plan powers the database off after a period of inactivity.
- **While it's off:**
  - the backend still starts, because table creation in the startup handler logs the error and continues;
  - `/livez` returns 200;
  - `/health` and the `/foods` endpoints return 503 (each worker may keep serving its cached `GET /foods` list for up to 2 minutes);
  - the frontend's data pages show the wake-up screen;
  - the landing page renders normally.
- **Recovery:**
  1. Power the service on in the Aiven console and wait until it shows as running.
  2. Restart the Render service `food-alternate` from the Render dashboard, or redeploy it. This lets the startup handler create any missing tables and gives the connection pool a fresh start.
  3. Check that `GET /health` returns 200.
- **Connection limits:** each connection attempt gives up after 5 s (`connect_timeout`), so an unreachable host can't stall startup or `/health` for minutes.

## Frontend: Vercel project `food-alternate`

- **Deploys:** connected to the GitHub repository through Vercel's GitHub integration. `main` deploys to production; other branches and pull requests get preview deployments.
- **Configuration:** the API base URL comes from `VITE_API_BASE_URL`, set in the Vercel project's environment variables. It's read at build time; when unset, it falls back to `/api`.
- **No CI deploy:** CI does not deploy the frontend. The old `amondnet/vercel-action` step was removed because it duplicated Vercel's own deploys and failed with "Could not retrieve Project Settings".

## CI secrets used

| Secret | Used by |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | the `deploy` job |

The secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are no longer used by CI and can be deleted from the repository settings.
