FROM python:3.11-slim

# Install Node.js for building frontend
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Frontend build ────────────────────────────────────────────────────────
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
# Empty string = all API calls go to same origin (relative paths)
ENV NEXT_PUBLIC_BACKEND_URL=""
RUN cd frontend && npm run build

# ── Backend install ───────────────────────────────────────────────────────
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Pre-download the FastEmbed model so first request isn't slow
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('BAAI/bge-small-en-v1.5')"

COPY backend/ ./backend/

# Put the Next.js static build inside the backend folder
RUN cp -r frontend/out backend/static

# ── Run ───────────────────────────────────────────────────────────────────
WORKDIR /app/backend
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
