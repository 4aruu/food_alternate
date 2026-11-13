# ── Backend Dockerfile ──────────────────────────────────
FROM python:3.11-slim

# Prevents Python from writing .pyc files and enables unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Render terminates TLS and proxies every request from its own IPs.
# With FORWARDED_ALLOW_IPS=* uvicorn trusts every hop and sets
# request.client.host to the LEFT-most X-Forwarded-For entry, which the
# client controls — so request.client.host is SPOOFABLE and must not be
# used for any security decision. The rate limiter is unaffected: it
# keys on the right-most X-Forwarded-For entry itself (see
# routers/foods.py rate_limit_key), not on request.client.host.
ENV FORWARDED_ALLOW_IPS=*

WORKDIR /app

# Install system dependencies required by psycopg2
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run as non-root user
RUN adduser --disabled-password --no-create-home appuser
USER appuser

EXPOSE 8000

# Gunicorn with uvicorn workers — production-grade process manager
CMD ["sh", "-c", "gunicorn main:app --worker-class uvicorn.workers.UvicornWorker --workers ${WEB_CONCURRENCY:-2} --bind 0.0.0.0:${PORT:-8000} --timeout 120 --graceful-timeout 30 --access-logfile - --error-logfile -"]
