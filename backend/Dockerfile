# ── Backend Dockerfile ──────────────────────────────────
FROM python:3.11-slim

# Prevents Python from writing .pyc files and enables unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

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

# Expose the API port
EXPOSE 8000

# Run the FastAPI server using the PORT environment variable (default 8000)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
