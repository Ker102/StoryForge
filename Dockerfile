FROM python:3.13-slim

WORKDIR /app

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# ── Frontend build ──
# Root package.json drives deps; vite root=client/, outDir=dist/public
COPY package.json package-lock.json* ./
RUN npm ci

COPY client/ client/
COPY attached_assets/ attached_assets/
COPY vite.config.ts tsconfig.json postcss.config.js components.json ./
COPY vite-plugin-meta-images.ts ./

# Build frontend directly with vite (not npm run build which also bundles a Node.js server we don't use)
RUN npx vite build

# ── Backend dependencies ──
COPY backend/pyproject.toml backend/
RUN pip install --no-cache-dir backend/

# ── Backend source ──
COPY backend/ backend/

# Point to the Vite build output
ENV PORT=8080
ENV STORYFORGE_STATIC_DIR=/app/dist/public

# Create non-root user for runtime security
RUN addgroup --system appuser && adduser --system --ingroup appuser appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

WORKDIR /app/backend
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
