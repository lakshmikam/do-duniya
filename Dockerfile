FROM node:22-alpine AS frontend
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=10000
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && useradd --create-home app
COPY backend ./backend
COPY --from=frontend /build/dist ./dist
RUN mkdir -p /app/runtime && chown -R app:app /app/runtime
USER app
EXPOSE 10000
CMD ["sh", "-c", "exec uvicorn backend.production:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]
